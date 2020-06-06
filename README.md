# SpotiLy
Get lyrics on an Electron-based GUI for the currently playing song on Spotify using the Genius API.

## Contents
1. [ Downloads ](#download)
2. [ Command Line Setup ](#cls)
3. [ Getting Started ](#starting)
   1. [ How to use? ](#usage) 
   2. [ Getting Client ID and Client Secret ](#client)
   3. [ Troubleshooting ](#trouble)
4. [ Scope for Improvement ](#improvement)
5. [ Screenshots ](#screenshots)
6. [ Contributors ](#contributors)



<a name="download"></a>
## Downloads
The app is available to download on Windows, MacOS, and Linux.

Download the installers from here:
1. [Windows]()
2. [MacOS]()
3. [Linux]()

<a name="cls"></a>
## Command Line Setup

To run the app from the command line, 
1. Download Node Package Manager (npm) utility
2. Run `npm install` in the base directory of the cloned repository to install the required NodeJs packages
3.  Run `npm start` to run the application 

<a name="starting"></a>
## Getting Started
This section explains how to obtain the *client ID* and the *client secret* values to run the app. In case you run into some problems, I have provided some troubleshooting techniques as well!
 
<a name="usage"></a>
### a. How to use?

1. On starting the app, you will be prompted to enter the client_id and client_secret values. See [this](#client) to get these values

<img src="resources/login.png" width="250px">

<!-- ![Image of Yaktocat](https://octodex.github.com/images/yaktocat.png)
Image 1: Page for entering *client ID* and a *client secret* values. -->

1. Then you be asked to confirm that these are indeed the right values. 
    1. If you still enter the wrong values, the loading page will just be stuck as shown. 
    2. To re-enter the values, select "logout" from the hamburger menu

<img src="resources/loading.png" width="250px">
<br>
<img src="resources/hamburger.png" width="500px">

1. You will now be redirected to the spotify login page from your browser. Login with your spotify account.
2. Dont forget to open spotify and play a song! This can be on any device with the same account.
3. The aapp will now automatically load lyrics and display them.
4. The song control buttons can be used to change tracks as well.
// Image here

<a name="client"></a>
### b. Getting Client ID and Client Secret
The Spotify API requires the use of a *client ID* and a *client secret* to verify the app. Because I am a poor college student, I did not have money to spend on a server😐. So, here we are. This is, however, a one-time deal. Once you have loaded these into the app, you will no longer have to do it again!

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your spotify account.
3. Click the "create an app" button.
<img src="resources/spotify_dash_home_nologin.png" width="500px" style="margin-left:20%">

1. The app name and description can be filled however you desire, but this is what I recommend: 
   1. App Name: "SpotiLy"
   2. App Description: "Get lyrics on an Electron-based GUI for the currently playing song on Spotify using the Genius API. (https://github.com/dhruvswarup123/SpotiLy)"
2. Click "Create"
3. In the app page, click settings.
<img src="resources/spotify_dash_main.png" width="500px">


1. In the section marked "Redirect URIs", paste `http://localhost:8000/callback`, and click add.
<img src="resources/spotify_dash_setting.png" width="300px">


1. Click "Save"
2.  Now copy and paste the client ID, and the client secret (after clicking "show client secret") into the app.
<img src="resources/spotify_dash_cs.png" width="500px">
    
<a name="trouble"></a>
### c. Troubleshooting

<a name="improvement"></a>
## Scope for Improvement


<a name="contributors"></a>
## Contributors

<a name="screenshots"></a>
## Screenshots