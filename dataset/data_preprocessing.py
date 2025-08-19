import pandas as pd
import numpy as np
import os
import json

def load_data(filename):
    data = pd.read_csv(filename)
    return data

def site_to_city():
    file = load_data('sitename.csv')
    df = pd.DataFrame(file)
    address = {}
    for index, row in df.iterrows():
        address[row['sitename']] = row['sitename']
        address[row['sitename']] = str(row['siteaddress'])[:3]

    address_list = [{'sitename': row['sitename'], 'sitecity': '花蓮縣' if str(row['siteaddress'])[:3] == '花蓮市' else str(row['siteaddress'])[:3] if pd.notna(row['siteaddress']) else '新北市'} for index, row in df.iterrows()]
    # print(address_list)
    with open('address.json', 'w', encoding='utf-8') as json_file:
        json.dump(address_list, json_file, ensure_ascii=False, indent=4)

def preprocess_data(file, filename):
    df = pd.DataFrame(file)
    # print(df.head())
    df_filtered = df[df['測項'].isin(['WIND_DIREC', 'WIND_SPEED', 'RAINFALL'])]
    output_directory = '2023'
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    output_path = os.path.join(output_directory, filename)
    df_filtered.to_csv(output_path, index=False)

def combine_data(file):
    df = pd.DataFrame(file)
    df.replace({'#': np.nan, '': np.nan}, inplace=True)
    output_directory = '2023'
    
    df_rainfall = df[df['測項'] == 'RAINFALL'].dropna(how='all')
    df_rainfall['Sum'] = df_rainfall.iloc[:, 3:27].apply(pd.to_numeric, errors='coerce').sum(axis=1, skipna=True)
    df_rainfall = df_rainfall[['測站', '日期', '測項'] + [col for col in df_rainfall.columns if col not in ['測站', '日期', '測項', 'Sum']] + ['Sum']]
    
    df_wind_speed = df[df['測項'] == 'WIND_SPEED'].dropna(how='all')
    df_wind_speed['Avg'] = df_wind_speed.iloc[:, 3:27].apply(pd.to_numeric, errors='coerce').mean(axis=1, skipna=True)
    df_wind_speed = df_wind_speed[['測站', '日期', '測項'] + [col for col in df_wind_speed.columns if col not in ['測站', '日期', '測項', 'Avg']] + ['Avg']]
    
    df_wind_direction = df[df['測項'] == 'WIND_DIREC'].dropna(how='all')
    df_wind_direction['Avg'] = df_wind_direction.iloc[:, 3:27].apply(pd.to_numeric, errors='coerce').mean(axis=1, skipna=True)
    df_wind_direction = df_wind_direction[['測站', '日期', '測項'] + [col for col in df_wind_direction.columns if col not in ['測站', '日期', '測項', 'Avg']] + ['Avg']]

    output_rainfall = os.path.join(output_directory, 'rainfall.csv')
    df_rainfall.dropna(axis=1, how='all', inplace=True)
    df_rainfall.to_csv(output_rainfall, mode='a', header=False, index=False, encoding='utf-8-sig')

    output_wind_speed = os.path.join(output_directory, 'wind_speed.csv')
    df_wind_speed.dropna(axis=1, how='all', inplace=True)
    df_wind_speed.to_csv(output_wind_speed, mode='a', header=False, index=False, encoding='utf-8-sig')

    output_wind_direction = os.path.join(output_directory, 'wind_direction.csv')
    df_wind_direction.dropna(axis=1, how='all', inplace=True)
    df_wind_direction.to_csv(output_wind_direction, mode='a', header=False, index=False, encoding='utf-8-sig')

def combine_data_by_city():
    df_rainfall = pd.read_csv('2023/rainfall.csv')
    df_wind_speed = pd.read_csv('2023/wind_speed.csv')
    df_wind_direction = pd.read_csv('2023/wind_direction.csv')

    site_count = []
    file = load_data('sitename.csv')
    df = pd.DataFrame(file)
    site_count = df['siteaddress'].apply(lambda x: str(x)[:3]).value_counts().to_dict()
    # print(site_count)

    with open('address.json', 'r', encoding='utf-8') as json_file:
        address = json.load(json_file)
        address_dict = {site['sitename']: site['sitecity'] for site in address}

        city_data = {'rainfall': {}, 'wind_speed': {}, 'wind_direction': {}}

        for _, row in df_rainfall.iterrows():
            city = address_dict.get(row['測站'], 'Unknown')
            if(city == '221'):
                city = '新北市'
            month = row['日期'][5:7]  # Extract the month from the date
            if month not in city_data['rainfall']:
                city_data['rainfall'][month] = {}
            if city not in city_data['rainfall'][month]:
                city_data['rainfall'][month][city] = 0
            city_data['rainfall'][month][city] += row['sum'] if not pd.isna(row['sum']) else 0

        for month in city_data['rainfall']:
            for city in city_data['rainfall'][month]:
                if city != '花蓮縣':
                    city_data['rainfall'][month][city] /= site_count[city]

        for _, row in df_wind_speed.iterrows():
            city = address_dict.get(row['測站'], 'Unknown')
            month = row['日期'][5:7]  # Extract the month from the date
            if month not in city_data['wind_speed']:
                city_data['wind_speed'][month] = {}
            if city not in city_data['wind_speed'][month]:
                city_data['wind_speed'][month][city] = {'total': 0, 'count': 0}
            city_data['wind_speed'][month][city]['total'] += row['avg'] if not pd.isna(row['avg']) else 0
            city_data['wind_speed'][month][city]['count'] += 1

        for _, row in df_wind_direction.iterrows():
            city = address_dict.get(row['測站'], 'Unknown')
            month = row['日期'][5:7]  # Extract the month from the date
            if month not in city_data['wind_direction']:
                city_data['wind_direction'][month] = {}
            if city not in city_data['wind_direction'][month]:
                city_data['wind_direction'][month][city] = {'total': 0, 'count': 0}
            city_data['wind_direction'][month][city]['total'] += row['avg'] if not pd.isna(row['avg']) else 0
            city_data['wind_direction'][month][city]['count'] += 1

        for month in city_data['wind_speed']:
            for city in city_data['wind_speed'][month]:
                if city_data['wind_speed'][month][city]['count'] > 0:
                    city_data['wind_speed'][month][city] = city_data['wind_speed'][month][city]['total'] / city_data['wind_speed'][month][city]['count']

        for month in city_data['wind_direction']:
            for city in city_data['wind_direction'][month]:
                if city_data['wind_direction'][month][city]['count'] > 0:
                    city_data['wind_direction'][month][city] = city_data['wind_direction'][month][city]['total'] / city_data['wind_direction'][month][city]['count']

        with open('city_data.json', 'w', encoding='utf-8') as json_file:
            json.dump(city_data, json_file, ensure_ascii=False, indent=4)

def daily_windir_avg():
    file = load_data('2023/wind_direction.csv')
    with open('address.json', 'r', encoding='utf-8') as json_file:
        siteinfo = json.load(json_file)
    siteinfo_dict = {site['sitename']: site['sitecity'] for site in siteinfo}
    head = ["City", "Date", "Avg"]
    df = pd.DataFrame(file)
    df.replace({'#': np.nan, '': np.nan}, inplace=True)
    output_directory = '2023'
    df_wind_direction = df[df['測項'] == 'WIND_DIREC'].dropna(how='all')
    df_wind_direction['Avg'] = df_wind_direction.iloc[:, 3:27].apply(pd.to_numeric, errors='coerce').mean(axis=1, skipna=True)
    df_wind_direction = df_wind_direction[['測站', '日期', 'Avg']]
    df_wind_direction['Date'] = df_wind_direction['日期'].apply(lambda x: x[:10])
    df_wind_direction['City'] = df_wind_direction['測站'].map(siteinfo_dict)

    df_wind_direction['Avg'] = pd.to_numeric(df_wind_direction['Avg'], errors='coerce')
    df_wind_direction_grouped = df_wind_direction.groupby(['City', 'Date'])['Avg'].mean().reset_index()

    output_wind_direction = os.path.join(output_directory, 'wind_direction_daily.csv')
    with open(output_wind_direction, 'w', encoding='utf-8-sig') as f:
        f.write(','.join(head) + '\n')
    df_wind_direction_grouped.to_csv(output_wind_direction, mode='a', header=False, index=False, encoding='utf-8-sig')

def daily_windspeed_avg():
    file = load_data('2023/wind_speed.csv')
    head = ["測站", "日期", "Avg"]
    df = pd.DataFrame(file)
    df.replace({'#': np.nan, '': np.nan}, inplace=True)
    output_directory = '2023'
    df_wind_speed = df[df['測項'] == 'WIND_SPEED'].dropna(how='all')
    df_wind_speed['Avg'] = df_wind_speed.iloc[:, 3:27].apply(pd.to_numeric, errors='coerce').mean(axis=1, skipna=True)
    df_wind_speed = df_wind_speed[['測站', '日期', 'Avg']]
    df_wind_speed['日期'] = df_wind_speed['日期'].apply(lambda x: x[:10])
    
    output_wind_speed = os.path.join(output_directory, 'wind_speed_daily.csv')
    with open(output_wind_speed, 'w', encoding='utf-8-sig') as f:
        f.write(','.join(head) + '\n')
    df_wind_speed.dropna(axis=1, how='all', inplace=True)
    df_wind_speed.to_csv(output_wind_speed, mode='a', header=False, index=False, encoding='utf-8-sig')

def main():
    directory = '2023_raw'
    for filename in os.listdir(directory):
        if filename.endswith('.csv'):
            file = load_data(os.path.join(directory, filename))
            preprocess_data(file, filename)

    directory = '2023_by_site'
    header = '測站,日期,測項,00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,sum\n'
    header_avg = '測站,日期,測項,00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,avg\n'
    output_directory = '2023'
    output_rainfall = os.path.join(output_directory, 'rainfall.csv')
    output_wind_speed = os.path.join(output_directory, 'wind_speed.csv')
    output_wind_direction = os.path.join(output_directory, 'wind_direction.csv')

    with open(output_rainfall, 'w', encoding='utf-8-sig') as f:
        f.write(header)

    with open(output_wind_speed, 'w', encoding='utf-8-sig') as f:
        f.write(header_avg)

    with open(output_wind_direction, 'w', encoding='utf-8-sig') as f:
        f.write(header_avg)
    for filename in os.listdir(directory):
        if filename.endswith('.csv'):
            file = load_data(os.path.join(directory, filename))
            # print(filename)
            combine_data(file)

    combine_data_by_city()

    site_to_city()

    daily_windir_avg()
    daily_windspeed_avg()

if __name__ == '__main__':
    main()