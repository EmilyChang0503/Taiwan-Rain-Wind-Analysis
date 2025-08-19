import matplotlib.pyplot as plt
import pandas as pd

rainfall_data = pd.read_csv('rainfall.csv')
rainfall_data['time'] = pd.to_datetime(rainfall_data['time'])
rainfall_data = rainfall_data.sort_values(by='time')

plt.figure(figsize=(10, 5))
plt.plot(rainfall_data['time'], rainfall_data['value'], label='Rainfall')
plt.xlabel('Time')
plt.ylabel('Rainfall (mm)')
plt.title('Rainfall Over Time')
plt.legend()
plt.grid(True)
plt.show()