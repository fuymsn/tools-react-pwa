import React, { Component } from 'react';
import '../styles/inline.css';
import '../vendor/dialog-polyfill/dialog-polyfill.css';
import dialogPolyfill from '../vendor/dialog-polyfill/dialog-polyfill.js';
import 'whatwg-fetch';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      visibleCards: {},
      selectedCity: null,
      selectedCities: [],
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      spinnerState: false,
      containerState: false,
      addDialog: null,
      /*
        * Fake weather data that is presented when the user first uses the app,
        * or when the user has not saved any cities. See startup code for more
        * discussion.
      */
      initialWeatherForecast: {
        key: '2459115',
        label: 'New York, NY',
        created: '2016-07-22T01:00:00Z',
        channel: {
          astronomy: {
            sunrise: "5:43 am",
            sunset: "8:21 pm"
          },
          item: {
            condition: {
              text: "Windy",
              date: "Thu, 21 Jul 2016 09:00 PM EDT",
              temp: 56,
              code: 24
            },
            forecast: [
              {code: 44, high: 86, low: 70},
              {code: 44, high: 94, low: 73},
              {code: 4, high: 95, low: 78},
              {code: 24, high: 75, low: 89},
              {code: 24, high: 89, low: 77},
              {code: 44, high: 92, low: 79},
              {code: 44, high: 89, low: 77}
            ]
          },
          atmosphere: {
            humidity: 56
          },
          wind: {
            speed: 25,
            direction: 195
          }
        }
      }
    }

    this.dialogClose = this.dialogClose.bind(this)
    this.dialogShow = this.dialogShow.bind(this)
    this.updateForecasts = this.updateForecasts.bind(this)
    this.addCity = this.addCity.bind(this)
  }

  componentDidMount() {
    // Your custom JavaScript goes here
    let app = {
      addDialog: document.querySelector('.mdl-dialog')
    };
    // if (!app.addDialog.showModal) {
      dialogPolyfill.registerDialog(app.addDialog);
    // }
    this.setState({
      
    });

    // register dialog

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/
    // TODO uncomment line below to test app with fake data
    this.updateForecastCard(this.state.initialWeatherForecast);

    // TODO add startup code here
    // this.setState({ selectedCities: localStorage.selectedCities });
    if (localStorage.selectedCities) {
      this.setState({
        selectedCities: JSON.parse(localStorage.selectedCities),
        addDialog: app.addDialog
      }, () => {
        this.state.selectedCities.forEach((city) => {
          this.getForecast(city.key, city.label);
        })
      })
    } else {
      let selectedCities = [
        { key: this.state.initialWeatherForecast.key, label: this.state.initialWeatherForecast.label }
      ];
      // this.updateForecastCard(this.state.initialWeatherForecast);
      this.setState({
        selectedCities: selectedCities,
        addDialog: app.addDialog
      }, ()=>{
        this.saveSelectedCities();
      })
    }
  }

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  // 更新天气卡片
  updateForecastCard (data) {
    var dataLastUpdated = new Date(data.created);
    var card = this.state.visibleCards[data.key];

    if (!card) {
      this.setState((prevState)=>{
        return {
          visibleCards: Object.assign({}, prevState.visibleCards, {
            [data.key]: data
          })
        }
      });
      // this.state.visibleCards[data.key] = card;
    }

    // Verifies the data provide is newer than what's already visible
    // on the card, if it's not bail, if it is, continue and update the
    // time saved in the card
    else {
      var cardLastUpdated = new Date(card.created);
      if (cardLastUpdated) {
        cardLastUpdated = new Date(cardLastUpdated);
        // Bail if the card has more recent data then the data
        if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
          return;
        }
      }
    }

    if (this.state.isLoading) {
      this.setState({ spinnerState: true })
      this.setState({ containerState: false });
      this.setState({ isLoading: false });
    }
  };

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  /*
  * Gets a forecast for a specific city and updates the card with the data.
  * getForecast() first checks if the weather data is in the cache. If so,
  * then it gets that data and populates the card with the cached data.
  * Then, getForecast() goes to the network for fresh data. If the network
  * request goes through, then the card gets updated a second time with the
  * freshest data.
  * 
  * 从雅虎获取天气信息
  * param: key:城市id, label:城市名
  */
  getForecast (key, label) {
    var statement = 'select * from weather.forecast where woeid=' + key;
    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' + statement;
    var _this = this;

    // TODO add cache logic here
    // if ('caches' in window) {
    //   caches.match(url).then(function(response) {
    //     if (response) {
    //       response.json().then(function updateFromCache(json) {
    //         var results = json.query.results;
    //         results.key = key;
    //         results.label = label;
    //         results.created = json.query.created;
    //         _this.updateForecastCard(results);
    //       });
    //     }
    //   });
    // }

    // Fetch the latest data.
    fetch(url)
      .then(response=>response.json())
      .then(response=>{
        let results = response.query.results;
        results.key = key;
        results.label = label;
        results.created = response.query.created;
        _this.updateForecastCard(results);
      })
      .catch(()=>{
        _this.updateForecastCard(_this.state.initialWeatherForecast);
      })
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  updateForecasts () {
    var keys = Object.keys(this.state.visibleCards);
    keys.forEach((key) => {
      this.getForecast(key);
    });
  };

  // TODO add saveSelectedCities function here
  saveSelectedCities () {
    var selectedCities = JSON.stringify(this.state.selectedCities);
    localStorage.selectedCities = selectedCities;
  }

  addCity(event) {
    let key = null;
    let label = null;
    let isInSelectedCities = false;
    let selectedCities = null;

    if (!this.state.selectedCity) {
      key = this.refs.selectCity[0].value;
      label = this.refs.selectCity[0].textContent;
    } else {
      key = this.state.selectedCity.key;
      label = this.state.selectedCity.label;
    }

    this.state.selectedCities.forEach((el, index)=>{
      if(el.key === key){
        isInSelectedCities = true;
        return;
      }
    })

    if(!isInSelectedCities){
      selectedCities = this.state.selectedCities.concat({ key: key, label: label })
    } else {
      selectedCities = this.state.selectedCities;
    }
    
    this.getForecast(key, label);
    // TODO push the selected city to the array and save here
    this.setState((prevState, props) => {
      return {
        selectCity: { key: key, label: label },
        selectedCities: selectedCities
      }
    }, ()=>{
      this.saveSelectedCities();
    });

    this.state.addDialog.close();
  }

  selectCityChange (event) {
    let index = event.target.selectedIndex;
    this.setState({
      selectedCity: {
        key: event.target[index].value,
        label: event.target[index].textContent
      }
    })
  }

  getIconClass (weatherCode) {
    // Weather codes: https://developer.yahoo.com/weather/documentation.html#codes
    weatherCode = parseInt(weatherCode, 10);
    switch (weatherCode) {
      case 25: // cold
      case 32: // sunny
      case 33: // fair (night)
      case 34: // fair (day)
      case 36: // hot
      case 3200: // not available
        return 'clear-day';
      case 0: // tornado
      case 1: // tropical storm
      case 2: // hurricane
      case 6: // mixed rain and sleet
      case 8: // freezing drizzle
      case 9: // drizzle
      case 10: // freezing rain
      case 11: // showers
      case 12: // showers
      case 17: // hail
      case 35: // mixed rain and hail
      case 40: // scattered showers
        return 'rain';
      case 3: // severe thunderstorms
      case 4: // thunderstorms
      case 37: // isolated thunderstorms
      case 38: // scattered thunderstorms
      case 39: // scattered thunderstorms (not a typo)
      case 45: // thundershowers
      case 47: // isolated thundershowers
        return 'thunderstorms';
      case 5: // mixed rain and snow
      case 7: // mixed snow and sleet
      case 13: // snow flurries
      case 14: // light snow showers
      case 16: // snow
      case 18: // sleet
      case 41: // heavy snow
      case 42: // scattered snow showers
      case 43: // heavy snow
      case 46: // snow showers
        return 'snow';
      case 15: // blowing snow
      case 19: // dust
      case 20: // foggy
      case 21: // haze
      case 22: // smoky
        return 'fog';
      case 24: // windy
      case 23: // blustery
        return 'windy';
      case 26: // cloudy
      case 27: // mostly cloudy (night)
      case 28: // mostly cloudy (day)
      case 31: // clear (night)
        return 'cloudy';
      case 29: // partly cloudy (night)
      case 30: // partly cloudy (day)
      case 44: // partly cloudy
        return 'partly-cloudy-day';
      default:
        return;
    }
  }

  dialogClose() {
    this.state.addDialog.close()
  }

  dialogShow() {
    this.state.addDialog.showModal();
  }

  render() {
    const visibleCards = this.state.visibleCards

    return (
      <div>
        <main className="mdl-layout__content">
          <div className="page-content" hidden={ this.state.containerState }>
            { Object.keys(visibleCards).map((key, index) => {
              const card = visibleCards[key];
              const sunrise = card.channel.astronomy.sunrise;
              const sunset = card.channel.astronomy.sunset;
              const current = card.channel.item.condition;
              const humidity = card.channel.atmosphere.humidity;
              const wind = card.channel.wind;
              
              let today = new Date();
              today = today.getDay();

              return (
                <div className="card cardTemplate weather-forecast" key={ "card" + index }>
                  <div className="city-key" hidden></div>
                  <div className="card-last-updated" hidden>{ card.created }</div>
                  <div className="location">{ card.label }</div>
                  <div className="date">{ current.date }</div>
                  <div className="description">{ current.text }</div>
                  <div className="current">
                    <div className="visual">
                      <div className={ "icon " + this.getIconClass(current.code) }></div>
                      <div className="temperature">
                        <span className="value">{ Math.round(current.temp) }</span><span className="scale">°F</span>
                      </div>
                    </div>
                    <div className="description">
                      <div className="humidity">{ Math.round(humidity) + '%' }</div>
                      <div className="wind">
                        <span className="value">{ Math.round(wind.speed) }</span>
                        <span className="scale">mph</span>
                        <span className="direction">{ wind.direction }</span>°
                      </div>
                      <div className="sunrise">{ sunrise }</div>
                      <div className="sunset">{ sunset }</div>
                    </div>
                  </div>
                  <div className="future">
                    { card.channel.item.forecast.filter((daily, index)=>index < 7).map((daily, index)=>{
                        return (
                          <div className="oneday" key={ "daily" + index }>
                            <div className="date">{ this.state.daysOfWeek[(index + today) % 7] }</div>
                            <div className={ "icon " + this.getIconClass(daily.code) }></div>
                            <div className="temp-high">
                              <span className="value">{ Math.round(daily.high) }</span>°
                            </div>
                            <div className="temp-low">
                              <span className="value">{ Math.round(daily.low) }</span>°
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </main>
        <div className="menuWeatherBox">
          <button id="menuWeather" className="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect">
            <i className="material-icons">add</i>
          </button>
          <ul className="mdl-menu mdl-menu--top-right mdl-js-menu mdl-js-ripple-effect" data-mdl-for="menuWeather">
            <li className="mdl-menu__item" onClick={ this.dialogShow }>Add</li>
            <li className="mdl-menu__item" onClick={ this.updateForecasts }>Refresh</li>
          </ul>
        </div>
        <dialog className="mdl-dialog" ref="dialog">
          <h4 className="mdl-dialog__title">Add new city</h4>
          <div className="mdl-dialog__content">
            <select id="selectCityToAdd" className="tools-select" onChange={ (e) => this.selectCityChange(e) } ref="selectCity">
              <option value="2357536">Austin, TX</option>
              <option value="2367105">Boston, MA</option>
              <option value="2379574">Chicago, IL</option>
              <option value="2459115">New York, NY</option>
              <option value="2475687">Portland, OR</option>
              <option value="2487956">San Francisco, CA</option>
              <option value="2490383">Seattle, WA</option>
            </select>
          </div>
          <div className="mdl-dialog__actions">
            <button id="butAddCity" type="button" className="mdl-button" onClick={ this.addCity }>Add</button>
            <button id="butAddCancel" type="button" className="mdl-button close" onClick={ this.dialogClose }>Cancel</button>
          </div>
        </dialog>
        <div className="loader">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle id="spinner" cx="16" cy="16" r="14" fill="none" hidden={ this.state.spinnerState }></circle>
          </svg>
        </div>
      </div>
    );
  }
}

export default App;
