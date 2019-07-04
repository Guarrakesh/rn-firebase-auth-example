/**
 *  /**
 * In una real-word app, possono verificarsi 3 scenari
 * 1) L'utente effettua autenticazione anonima e continua così per il resto della sua vita
 * 2) L'utente effettua autenticazione anonima, riceva una idToken da firebase, che viene mandata al server, che genererà una jwt custom.
 *    La jwt custom servirà per le successive richieste. Su firebase, l'utente viene creato come provider "anonimo"
 *    Successivamente l'utente, effettua login con PhoneNumber (o Facebook, qui non implementato).
 *    Una volta inserito numero di cellulare e convalidato il codice via SMS (su Android viene convalidato automaticamente)
 *    L'app linka il nuovo provider PhoneNumberProvider all'utente attuale (anonimo), e reinvia una idToken aggiornata al server
 *
 * 3) L'utente logga direttamente con PhoneNumberProvider, genera una token che viene mandata al server, che genererà una jwt custom.
 *
 * *** IMPORTANTE ***
 * Per fare in modo che l'uente riceva l'SMS da firebase, bisogna effettuare l'APP VERIFICARTION
 * https://firebase.google.com/docs/auth/ios/phone-auth#enable-app-verification
 *
 * Questo test è stato effettuato con un device Whitelisted!!!
 * https://firebase.google.com/docs/auth/ios/phone-auth#test-with-whitelisted-phone-numbers

 * Per questo test si è usato react-native-firebase@6.0.0 che non è stable, ma le stesse API si trovano nella versione 5.*
 *
 * Per l'autenticazione via Facebook, vedere https://invertase.io/oss/react-native-firebase/v6/auth/social-auth
 *
 * @format
 * @flow
 */

import firebase  from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import {Button, Container, Content, Header, Input, Item, Tab, Tabs} from "native-base";
import React, {Component} from "react";
import {ActivityIndicator, AsyncStorage, StyleSheet, Text, View} from "react-native";

// TODO(you): import any additional firebase services that you require for your app, e.g for auth:
//    1) install the npm package: `yarn add @react-native-firebase/auth@alpha` - you do not need to
//       run linking commands - this happens automatically at build time now
//    2) rebuild your app via `yarn run run:android` or `yarn run run:ios`
//    3) import the package here in your JavaScript code: `import '@react-native-firebase/auth';`
//    4) The Firebase Auth service is now available to use here: `firebase.auth().currentUser`

type Props = {};

export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = { phoneVerificationId: undefined };

  }
  async anonymousLogin() {
    const userCredential = await auth().signInAnonymously();

    const idToken = await auth().currentUser.getIdTokenResult();

    // Cosa fare con questa idToken? Inviala al server, che si occuperà di verificarla e generare una jwt custom per il client.
  }
  async phoneLogin(credential: auth.AuthCredential) {


    // const credential = auth.PhoneAuthProvider.credential(await user.getIdToken())
    if (auth().currentUser) {
      //Utente già loggato, linko il nuovo provider
      const data = await auth().currentUser.linkWithCredential(credential);
      // ... Effettuo un force refresh della idToken per poi spedirla al server
      const newIdToken = await auth().currentUser.getIdToken(true);
    } else {
      const data = await auth().signInWithCredential(credential);
      const idToken = await auth().currentUser.getIdToken();
      // Cosa fare con questa idToken? Inviala al server, che si occuperà di verificarla e generare una jwt custom per il client.
    }
    //

    //
    // ... Salvare eventuali informazioni nell'async storage (oltre alla jwt-token restituita dal server)
    // await AsyncStorage.setItem('credentialToken', (await user.getIdToken()));
  }
  async verifyPhoneCode() {
    const credential = await auth.PhoneAuthProvider.credential(this.state.phoneVerificationId, this.state.confirmNumber);
    this.phoneLogin(credential);
  }
  async verifyPhoneNumber() {

    try {

      if (!this.state.phoneNumber) {
        return;
      }

      // Vedi index.js
      auth().verifyPhoneNumber(this.state.phoneNumber, 100000,true).on('state_changed', (phoneAuthSnapshot) => {
        // Bisogna gestire anche i casi di errore https://rnfirebase.io/docs/v5.x.x/auth/phone-auth#verifyPhoneNumber
        switch (phoneAuthSnapshot.state) {
          case firebase.auth.PhoneAuthState.CODE_SENT:
            console.log("Code SENT");
            this.setState({ phoneVerificationId: phoneAuthSnapshot.verificationId});
            break;
          case firebase.auth.PhoneAuthState.ERROR:
            alert('verification error');

            break;
            // ---------------------
            // ANDROID ONLY EVENTS
            // ---------------------
          case firebase.auth.PhoneAuthState.AUTO_VERIFY_TIMEOUT: // or 'timeout'
            console.log('auto verify on android timed out');
            // proceed with your manual code input flow, same as you would do in
            // CODE_SENT if you were on IOS
            break;
          case firebase.auth.PhoneAuthState.AUTO_VERIFIED: // or 'verified'
            // auto verified means the code has also been automatically confirmed as correct/received
            // phoneAuthSnapshot.code will contain the auto verified sms code - no need to ask the user for input.
            console.log('auto verified on android');
            this.setState({ phoneVerificationId: phoneAuthSnapshot.verificationId});
            const { verificationId, code } = phoneAuthSnapshot;
            const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
            this.phoneLogin(credential);


            break;
        }
      });



    } catch (ex) {
      console.log(ex);
    }
  }

  render() {
    return (
        <Container>
          <Header hasTabs />
          <Tabs>
            <Tab heading="Home">
              <View style={styles.container}>
                <Text style={styles.welcome}>
                  Welcome to React Native + Firebase!
                </Text>
                <Text />

                {!firebase.apps.length && (
                    <Text style={styles.instructions}>
                      {`\nYou currently have no Firebase apps registered, this most likely means you've not downloaded your project credentials. Visit the link below to learn more. \n\n ${firebaseCredentials}`}
                    </Text>
                )}
              </View>
            </Tab>
            <Tab heading="Anonymous">
              <View style={styles.container}>

                <Button full onPress={this.anonymousLogin.bind(this)}>
                  <Text>"Entra anonimamente</Text>
                </Button>

              </View>
            </Tab>
            <Tab heading="Phone auth">
              <Content padder>
                <Item>
                  <Text style={styles.instructions}>
                    Inserisci il numero di telefono 3404645283 e il codice di
                    verifica 00000 (DEMO)
                  </Text>
                </Item>
                <Item>
                  <Input
                      placeholder="Numero di cell"
                      value={this.state.phoneNumber}
                      onChange={e =>
                          this.setState({ phoneNumber: e.nativeEvent.text })
                      }
                  />
                </Item>

                  <Button full onPress={this.verifyPhoneNumber.bind(this)}>
                    <Text>Verifica numero di telefono</Text>
                  </Button>

                <Item>
                  <Input
                      placeholder="Codice di verifica"
                      disabled={!this.state.phoneVerificationId}
                      value={this.state.confirmNumber}
                      onChange={e =>
                          this.setState({ confirmNumber: e.nativeEvent.text })
                      }
                  />
                </Item>

                  <Button disabled={!this.state.phoneVerificationId} full onPress={this.verifyPhoneCode.bind(this)}>
                    <Text>Conferma codice</Text>
                  </Button>




                {this.state.isLoading && <ActivityIndicator />}
              </Content>
            </Tab>
          </Tabs>
        </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});
