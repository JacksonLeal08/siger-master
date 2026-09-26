import datetime
import subprocess

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
commit_msg = f'- Implementacao da Toolbar Hibrida Premium Opcao 1 e 2 no Cockpit SIGER "alteracao" {now}'

print(f"Executando commit: {commit_msg}")
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
