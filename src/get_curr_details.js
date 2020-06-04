const remote = require('electron').remote;

var LOGIN_CACHE = path.resolve(__dirname, '.login_cache');
var LYRICS_CACHE = path.resolve(__dirname, '.lyrics_cache');
var KEYS_CONFIG = path.resolve(__dirname, 'keys.config');
var access_token = null, refresh_token = null;
var lyrics_cache = {};

var client_id;
var client_secret;


var menubar = {
    status: false,
    open: function() {
        document.getElementById("dropdown").style.display = "block";
        this.status = true;
    },
    close: function() {
        document.getElementById("dropdown").style.display = "none";
        this.status = false;
    },
    toggle: function(){
        if (this.status == false){
            this.open();
        }
        else{
            this.close();
        }
    }
}

function init_all(){
    // First initialize the close and minimize buttons
    document.getElementById("minimize").addEventListener("click", function (e) {
        var window = remote.getCurrentWindow();
        window.minimize(); 
    });

    document.getElementById("close").addEventListener("click", function (e) {
        var window = remote.getCurrentWindow();
        window.close(); 
    });

    

    // Try to get the client id and secret
    try {
        if(fs.existsSync(KEYS_CONFIG)) {
            let auth_details = JSON.parse(fs.readFileSync(KEYS_CONFIG));
            client_id = auth_details.client_id;
            client_secret = auth_details.client_secret;
        }
        else {
            client_id = '';
            client_secret = '';
        }
    } catch (err) {
        client_id = '';
        client_secret = '';
        console.log(err);
    }

    // If not found, then ask the user for details and wait
    if (client_id == "" || client_secret == ""){
        prompt_for_details();
        // fs.writeFileSync("keys.config", JSON.stringify(auth_details))
    }
    else{
        set_auth_details(client_id, client_secret);
    }

    wait_for_keys();

    // Read the lyrics cache anyway
    try {
        if(fs.existsSync(LYRICS_CACHE)) {
            lyrics_cache = JSON.parse(fs.readFileSync(LYRICS_CACHE));
        }
    } catch (err) {
        lyrics_cache = null
        console.log(err);
    }
}

function prompt_for_details(){
  client_id = "";
  client_secret = "";

  document.getElementById("input_keys").style.display = "block";
  document.getElementById("control").style.display = "none";
}

first_time = true;
var ci, cs;

function submit_keys(){
    ci = document.getElementById("client_id").value;
    cs = document.getElementById("client_secret").value;

    if (ci == '' || cs == ''){
        document.getElementById("error_no_input").style.display = "block";
        return;
    }

    if (first_time){
        document.getElementById("client_id").disabled = true;
        document.getElementById("client_secret").disabled = true;
        document.getElementById("double_check").style.color = "white";
        
        document.getElementById("submit_keys").style.display = "none";
        document.getElementById("yesno").style.display = "block";
        document.getElementById("error_no_input").style.display = "none";

        first_time = false;
        return;
    }

    if (ci != "" && cs != ""){
        set_auth_details(ci, cs);
        document.getElementById("input_keys").style.display = "none";
        document.getElementById("control").style.display = "block";
    }
}

function shit_go_back(){
    document.getElementById("client_id").disabled = false;
    document.getElementById("client_secret").disabled = false;
    document.getElementById("double_check").style.color = "#252525";
    document.getElementById("submit_keys").style.display = "block";
    document.getElementById("yesno").style.display = "none";
    document.getElementById("error_no_input").style.display = "none";
    first_time = true;
}

function no_error(){
    document.getElementById("was_error").style.display = "none";
}

function set_auth_details(client_id_, client_secret_){
    client_id = client_id_;
    client_secret = client_secret_;
    set_auth_details_spotify_auth(client_id_, client_secret_);
}

function wait_for_keys(){
    if (client_id == "" || client_secret == ""){
      setTimeout(wait_for_keys, 1000);
      console.log("Waiting for keys")
      return;
    }

    // once done waiting for keys: keys have been set
    start_server();
    start_program();
}

function reload_app(){
    remote.getCurrentWindow().reload();
}

function wait_till_access(){
    console.log("Waiting for token...")
    if (access_token == null){
        setTimeout(wait_till_access, 1000);
        return;
    }

    var options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    
    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, data) {
        if ([400, 401, 403, 404].includes(response.statusCode)){
            console.log("logging in againn")
            login_spotify();
        }

        setInterval(get_from_file, 1000);
    })

    document.getElementById("prev").addEventListener('click', debounce(prev_song, 500)); 
    document.getElementById("next").addEventListener('click', debounce(next_song, 500)); 
    document.getElementById("toggle").addEventListener('click', debounce(toggle_song, 500));   

    fs.writeFileSync(KEYS_CONFIG, JSON.stringify({
        "client_id": client_id,
        "client_secret": client_secret
    }))
}

function start_program(){
    try {
        if(fs.existsSync(LOGIN_CACHE)) {
            let data = fs.readFileSync(LOGIN_CACHE);
            data = JSON.parse(data);
            
            try{
                access_token = data.access_token;
                refresh_token = data.refresh_token;
            }
            catch{
                login_spotify();
            }
        }
        else {
            login_spotify();
        }
    } catch (err) {
        console.error(err);
    }

    wait_till_access();
}

function set_tokens(access, refresh){
    access_token = access;
    refresh_token = refresh;
}

const open = require('open');
function login_spotify(){
    open("http://localhost:8000/login");
}

var prev_song_deets = {track: null, artist: null};
function get_from_file(){
    
    if (access_token == null){return;}

    var options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    
    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, data) {
        if (data == null){
            return;
        } else if (data.item == null) {
            return;
        }

        let _song_name = data.item.name;
        let _artist = data.item.artists[0].name;

        if (prev_song_deets.track != _song_name || prev_song_deets.artist != _artist){
            prev_song_deets.track  = _song_name;
            prev_song_deets.artist = _artist;
            document.getElementById("curr_song").innerHTML = _song_name.replace(/\(.*?\)/g, "");
            document.getElementById("artist").innerHTML = _artist;
            document.getElementById("_curr_song").innerHTML = _song_name.replace(/\(.*?\)/g, "");
            document.getElementById("_artist").innerHTML = _artist;
            curr_query = Math.round(Math.random() * 1000);
            get_lyrics(_song_name, _artist, curr_query);
        }
    });
}

const GENIUS_CLIENT_ACCESS = "J6UckzB1kNRSwaZ4AvwYd48M8ystmiq204KzNwp9eeulMb8JMV7s4l8ucAJcx0Kg"
GENIUS_URL_API = "https://api.genius.com/"
GENIUS_URL_SEARCH = "search?"
var api = require('genius-api');
var genius = new api(GENIUS_CLIENT_ACCESS);
fuzz = require('fuzzball');

function pr(a){
    console.log(a);
}

function get_lyrics(songname, artist, query){
    document.getElementById("lyrics").innerHTML = "Searching for lyrics...";
    // console.log("Getting lyrics")
    if (songname+'@'+artist in lyrics_cache){
        pr("Found in DB!")
        getLyricsFromURL(lyrics_cache[songname+'@'+artist], query);
    }
    else {
        genius.search(songname + ' ' + artist).then(function(response) {

            var id = null;
    
            let fuzz_choices = response.hits;
            let id_search_query = songname + ' ' + artist;
            let sort_options = {
                processor: choice => choice.result.full_title,  // Takes choice object, returns string, default: no processor. Must supply if choices are not already strings.
                limit: 1, // Max number of top results to return, default: no limit / 0.
                cutoff: 50, // Lowest score to return, default: 0
            };
    
            results = fuzz.extract(id_search_query, fuzz_choices, sort_options);        
            // pr(results)
            // pr("1: " + id_search_query)
    
            not_found_message = "Lyrics not found! Genius API is to blame lmao. Try manually adding genius url to lyrics_cache file";
    
            if (results.length == 0){
                document.getElementById("lyrics").innerHTML = not_found_message;
                id_search_query = songname.replace(/-.*/g, "") + ' ' + artist;
                // pr("2: " + id_search_query)
                results = fuzz.extract(id_search_query, fuzz_choices, sort_options);        
                // pr(results)
    
                if (results.length == 0){
                    document.getElementById("lyrics").innerHTML = not_found_message;
                    id_search_query = songname.replace(/(".*"|-.*)/g, "") + ' ' + artist;
                    // pr("3: " + id_search_query)
    
                    results = fuzz.extract(id_search_query, fuzz_choices, sort_options);        
                    // pr(results)
                    if (results.length == 0){
                        document.getElementById("lyrics").innerHTML = not_found_message;
                        return;
                    }
                }
            }
    
            id = results[0][0].result.id;
        
            genius.song(id).then(function(response) {   
                // console.log(response.song.url)
                getLyricsFromURL(response.song.url, query);
              }).catch(function(error) {
                console.error(error);
              });
          });
    }
    
}

const cheerio = require("cheerio")
var curr_query;

function getLyricsFromURL(url, query) {
    document.getElementById("lyrics").innerHTML = "Searching for lyrics...";
    for (var i = 0; i < 5; i++){
        // console.log("Loop no: " + i)
        request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);
                var lyrics = ($(".lyrics").text()).trim();

                // console.log("Lyrics found... might be empty")
                // console.log(lyrics.substring(1, 300))
                if (lyrics != ""){
                    // console.log(curr_query, query, url);
                    if (query != curr_query) return;
                    document.getElementById("lyrics").innerHTML = lyrics.replace(/[\n]/g, "<br>");
                }
            }
        })
    }
}


function next_song(){
    var options = {
        url: 'https://api.spotify.com/v1/me/player/next',
        headers: { 'Authorization': 'Bearer ' + access_token },
    };
      request.post(options, function(error, response) {});
}

function prev_song(){
    var options = {
        url: 'https://api.spotify.com/v1/me/player/previous',
        headers: { 'Authorization': 'Bearer ' + access_token },
    };
      
    request.post(options, function(error, response) {});
}


function toggle_song(){
    var options = {
        url: 'https://api.spotify.com/v1/me/player/pause',
        headers: { 'Authorization': 'Bearer ' + access_token },
    };
      
      request.put(options, function(error, response) {
          if (response.statusCode == 403){
            var options = {
                url: 'https://api.spotify.com/v1/me/player/play',
                headers: { 'Authorization': 'Bearer ' + access_token },
              };
              
              request.put(options, function(error, response) {});
          }
      });
}


const debounce = (func, delay) => { 
    let debounceTimer 
    return function() { 
        const context = this
        const args = arguments 
            clearTimeout(debounceTimer) 
                debounceTimer 
            = setTimeout(() => func.apply(context, args), delay) 
    } 
}  


function refresh(){
    try {
        if(fs.existsSync(LYRICS_CACHE)) {
            lyrics_cache = JSON.parse(fs.readFileSync(LYRICS_CACHE));
        }
    } catch (err) {
        console.log(err);
    }

    curr_query = Math.round(Math.random() * 1000);
    get_lyrics(prev_song_deets.track, prev_song_deets.artist, curr_query);
}

function open_help(){
    menubar.close();
    open('https://github.com/dhruvswarup123/SpotiLy/blob/master/README.md');
}

function logout(){
    menubar.close();
    try{
        fs.unlinkSync(KEYS_CONFIG);
    } catch {};
    try{
        fs.unlinkSync(LOGIN_CACHE);
    }catch{};    
    remote.getCurrentWindow().reload();
}