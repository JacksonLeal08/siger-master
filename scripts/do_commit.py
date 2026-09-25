import datetime
import subprocess

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
commit_msg = f'- Reformulacao da pagina de login em Dark Glassmorphism e novo cenario realista "alteracao" {now}'

print(f"Executando commit: {commit_msg}")
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
