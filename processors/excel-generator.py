import csv
from xlsxwriter.workbook import Workbook
import sys

csvfile=sys.argv[1]
workbook = Workbook(csvfile[:-4] + '.xlsx')
worksheet = workbook.add_worksheet()
worksheet.set_column(0,80, 20)
print(csvfile)
with open(csvfile, 'rt', encoding='utf8') as f:
   reader = csv.reader(f)
   for r, row in enumerate(reader):
       for c, col in enumerate(row):
           worksheet.write(r, c, col)
workbook.close()