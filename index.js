/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Piccolo workaround per il seguente issue su react-native-firebase
// https://github.com/invertase/react-native-firebase/issues/2321
global.isBoolean = function(arg) {
  return typeof arg === "boolean";
};


AppRegistry.registerComponent(appName, () => App);
