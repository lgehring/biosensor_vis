import pandas as pd
import numpy as np

# load csv
df = pd.read_csv('biosensors.csv', index_col=0)
# check that there are no missing values
print(df.isnull().sum())

# convert time index to DateTimeIndex
df.index = pd.DatetimeIndex(df.index)
print(f'Number of rows in the initial csv file: {df.shape[0]}')
#print(df.head())

# add missing dates and fill missing values with NaN
data_range = pd.date_range(start='2015-05-20 18:54:00+00:00', end='2016-03-30 00:00:00+00:00', freq='min')
df = df.reindex(data_range, fill_value=np.NaN)
df.index.name = 'Time'
print(f'Number of rows in the final csv file: {df.shape[0]}')
#print(df.head())

# save extended csv file
df.to_csv('biosensors_all_dates.csv')

