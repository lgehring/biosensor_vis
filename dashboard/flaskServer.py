#/***
# * @author Marit Bockstedte
# ***/

#!flask/bin/python
from flask import Flask, render_template, redirect, url_for
import os
import sys


app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def index():
    return redirect(url_for('base'))

@app.route('/base')
def base():
    return render_template('base.html')

@app.route('/Heartrate')
def Heartrate():
    return render_template('Heartrate.html', data="'static/data/biosensors_all_dates.csv'")

@app.route('/Steps')
def Steps():
    return render_template('Steps.html', data="'static/data/biosensors_all_dates.csv'")

@app.route('/Calories')
def Calories():
    return render_template('Calories.html', data="'static/data/biosensors_all_dates.csv'")

@app.route('/Temperature')
def Temperature():
    return render_template('Temperature.html')

@app.route('/Data_Analysis')
def Data_Analysis():
    return render_template('Data_Analysis.html',  data="'static/data/biosensors_all_dates.csv'")

@app.route('/About')
def About():
    return render_template('About.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
