import datetime
import subprocess

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
commit_msg = f'- Plano de implementacao e previa interativa da Home Geral Unificada 360 "alteracao" {now}'

print(f"Executando commit: {commit_msg}")
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
