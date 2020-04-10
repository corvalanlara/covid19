from datetime import date
import csv

contagiados = input("Ingrese total de contagiados\n").strip()
muertos = input("Ingrese total de muertos\n").strip()
recuperados = input("Ingrese el total de recuperados\n").strip()
hoy = date.today().isoformat()

## PARA DATOS LITE
with open("testlite.csv" , "a", newline='') as f:
    a = csv.writer(f, delimiter=",")
    a.writerow([hoy, contagiados, recuperados, muertos])


## PARA DATOS COMPLETOS
with open("test.csv", "r") as f:
    _, aindice, acontagiados, _, _, _, aretirados, _, _ = f.readlines()[-1].split(",")

#NUEVOS = CONTAGIADOS DE HOY - CONTAGIADOS DE AYER
nuevos = str(int(contagiados) - int(acontagiados))

#RETIRADOS ACUMULADOS = MUERTOS + RECUPERADOS
retirados = str(int(muertos) + int(recuperados))

#RETIRADOS AL DIA = RETIRADOS ACUMULADOS DE HOY - RETIRADOS ACUMULADOS DE AYER
retirados_al_dia = str(int(retirados) - int(aretirados))

#INFECTADOS = CONTAGIADOS DE HOY - RETIRADOS ACUMULADOS
infectados = str(int(contagiados) - int(retirados))

#INDICE
indice = aindice + 1;

with open("test.csv", "a") as f:
    a = csv.writer(f, delimiter=",")
    a.writerow([hoy, indice, contagiados, nuevos, recuperados, muertos, retirados, retirados_al_dia, infectados])

print("Operación exitosa")
