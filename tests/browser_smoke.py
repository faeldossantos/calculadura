"""Functional checks in an isolated browser: pip install playwright, then python tests/browser_smoke.py."""
import json
import os
import shutil
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('APP_URL', 'http://127.0.0.1:5173')

with sync_playwright() as p, tempfile.TemporaryDirectory() as temp:
    executable = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
    browser = p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL)
    expect(page.get_by_role('heading', name='Visão geral.', exact=True)).to_be_visible()
    expect(page.locator('tbody tr')).to_have_count(5)
    page.get_by_role('button', name='Usar meus dados', exact=True).click()
    page.get_by_role('button', name='Sim, começar do zero').click()
    expect(page.get_by_role('heading', name='Um novo começo por aqui')).to_be_visible()
    assert not json.loads(page.evaluate("localStorage.getItem('calma-financas-v1')"))['demo']

    def add(kind, amount, description):
        page.get_by_role('button', name='Nova transação', exact=True).click()
        dialog = page.get_by_role('dialog')
        dialog.get_by_role('button', name=kind, exact=True).click()
        dialog.get_by_label('Qual é o valor?').fill(amount)
        dialog.get_by_label('Descrição', exact=True).fill(description)
        dialog.get_by_role('button', name=f'Adicionar {kind.lower()}').click()
        expect(dialog).not_to_be_visible()

    add('Receita', '1.000,00', 'Salário de teste')
    add('Despesa', '49,90', 'Almoço de teste')
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 950,10')
    page.reload()
    expect(page.locator('tbody tr')).to_have_count(2)
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 950,10')
    page.get_by_role('button', name='Editar Almoço de teste', exact=True).click()
    page.get_by_role('dialog').get_by_label('Qual é o valor?').fill('59,90')
    page.get_by_role('button', name='Salvar alterações', exact=True).click()
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 940,10')
    page.get_by_role('button', name='Mês anterior', exact=True).click()
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 0,00')
    page.get_by_role('button', name='Próximo mês', exact=True).click()
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 940,10')

    page.get_by_role('button', name='Orçamentos', exact=True).click()
    page.get_by_role('button', name='Novo orçamento', exact=True).click()
    page.get_by_role('dialog').get_by_label('Limite mensal (R$)').fill('100,00')
    page.get_by_role('button', name='Salvar orçamento', exact=True).click()
    expect(page.locator('.budget-status')).to_contain_text('R$ 40,10 disponíveis')
    page.get_by_role('button', name='Editar orçamento de Alimentação').click()
    page.get_by_role('dialog').get_by_label('Limite mensal (R$)').fill('50,00')
    page.get_by_role('button', name='Salvar orçamento', exact=True).click()
    expect(page.locator('.budget-status')).to_contain_text('R$ 9,90 acima')

    page.get_by_role('button', name='Transações', exact=True).click()
    page.get_by_role('textbox', name='Buscar transação').fill('almoço')
    expect(page.locator('tbody tr')).to_have_count(1)
    page.get_by_role('button', name='Limpar busca', exact=True).click()
    page.get_by_role('button', name='Receitas', exact=True).click()
    expect(page.locator('tbody tr')).to_have_count(1)
    expect(page.locator('tbody')).to_contain_text('Salário de teste')
    page.get_by_role('button', name='Todas', exact=True).click()
    page.get_by_role('button', name='Filtros', exact=True).click()
    page.locator('.filter-row select').select_option('Alimentação')
    expect(page.locator('tbody tr')).to_have_count(1)
    expect(page.locator('tbody')).to_contain_text('Almoço de teste')
    page.get_by_role('button', name='Limpar filtros', exact=True).click()
    with page.expect_download() as csv_info:
        page.get_by_role('button', name='Exportar CSV', exact=True).click()
    csv_file = Path(temp) / 'transactions.csv'
    csv_info.value.save_as(csv_file)
    assert '"-59,90"' in csv_file.read_text(encoding='utf-8-sig')

    page.get_by_role('button', name='Seus dados', exact=True).click()
    with page.expect_download() as backup_info:
        page.get_by_role('button', name='Fazer backup', exact=True).click()
    backup_file = Path(temp) / 'backup.json'
    backup_info.value.save_as(backup_file)
    backup = json.loads(backup_file.read_text())
    assert len(backup['transactions']) == 2 and len(backup['budgets']) == 1
    page.get_by_role('button', name='Transações', exact=True).click()
    page.get_by_role('button', name='Excluir Almoço de teste', exact=True).click()
    page.get_by_role('button', name='Excluir transação', exact=True).click()
    expect(page.locator('tbody tr')).to_have_count(1)
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 1.000,00')
    page.get_by_role('button', name='Seus dados', exact=True).click()
    page.locator('input[type=file]').set_input_files(str(backup_file))
    page.get_by_role('button', name='Restaurar backup', exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('Backup restaurado com sucesso.')
    page.get_by_role('button', name='Transações', exact=True).click()
    expect(page.locator('tbody tr')).to_have_count(2)
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 940,10')
    page.get_by_role('button', name='Nova transação', exact=True).click()
    page.get_by_role('dialog').get_by_label('Qual é o valor?').fill('12.34')
    page.get_by_role('dialog').get_by_label('Descrição', exact=True).fill('Valor inválido')
    page.get_by_role('button', name='Adicionar despesa', exact=True).click()
    expect(page.get_by_role('alert')).to_have_text('Digite um valor válido, como 49,90.')
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()

    for width in [360, 390, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.wait_for_timeout(250)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}px'
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='Abrir menu', exact=True).click()
    page.get_by_role('button', name='Visão geral', exact=True).click()
    expect(page.get_by_role('heading', name='Visão geral.', exact=True)).to_be_visible()
    add('Despesa', '0,01', 'Teste no celular')
    expect(page.locator('.balance-card .stat-amount')).to_have_text('R$ 940,09')
    assert not errors, errors
    browser.close()
    print('PASS: create, edit, delete, persistence, month selection, budgets, search, filters, CSV, backup, restore, validation, mobile flow, five responsive widths; no browser errors.')
