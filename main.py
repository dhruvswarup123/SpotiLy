import spotipy
import spotipy.util as util
import threading
import time
import lyricsgenius
import json
import os.path as path
import multiprocessing
from functools import lru_cache
import signal
import sys
import re
from flask import Flask, jsonify, request, render_template
app = Flask(__name__)


# ------------------- Constants -------------------
LYRICS_CACHE = ".lyrics_cache"
GENIUS_CLIENT_ACCESS = "7_i1fxTpNla25VATbAaQUPEelnkiWnoMvkb2TVkIbfDog3Ia6X8urf5OoBDUxWWG"
SPOTIFY_CLIENT_ID = "3caccfac21174c25be5db7ab483234fa"
SPOTIFY_CLIENT_SECRET = "7ad6bc0a0dc84372b5eeef5c8f508380"
SONG_UPDATE_FREQ_S = 0.5
MAIN_UPDATE_FREQ_S = 0.5
# -----------------------------------------------

# ------------------- Globals -------------------
currTrackDetails = None
prevTrackDetails = None
lyrics_db = dict()
SaveThread = None
spotifyObject = None
UpdateProc = None
send_to_electron = None
spotifyObject_process = None
server = None
# -----------------------------------------------


def getLyrics(genius_object, currSong, artist):
    """ Get lyrics from the Genius database. Can take time -> run on a seperate thread
                :param genius_object: lyricsgenius.Genius -> using genius api auth
                :param currSong: string -> song to find lyrics for
                :param artist: string -> artist for song to find lyrics for
    """

    global lyrics_db

    if getKeyForDb(currSong, artist) in lyrics_db.keys():
        print("Lyrics found in db. Link: " + lyrics_db[getKeyForDb(currSong, artist)])
        for i in range(10):
            lyrics = genius_object._scrape_song_lyrics_from_url(lyrics_db[getKeyForDb(currSong, artist)])
            if lyrics is not None:
                return lyrics

        print("Link not working... Removing from Cache")
        del lyrics_db[getKeyForDb(currSong, artist)]

    for i in range(5):
        edited = ""
        if songWasChanged(currSong, artist):
            print("Song was changed. Moving forward...")
            return -1

        for j in currSong:
            if j == '(':
                break
            edited += j

        song = genius_object.search_song(edited, artist)

        if song is None:
            print("Lyrics not found! Trying again...")
        else:
            # print(song.lyrics)
            lyrics_db[getKeyForDb(currSong, artist)] = song.url
            global SaveThread
            if SaveThread and SaveThread.is_alive():
                SaveThread.join()
            SaveThread = threading.Thread(target=save_lyrics_db, args=(lyrics_db, ))
            SaveThread.run()
            print(song.url)
            return song.lyrics
    print("Not found. Genius is to blame. Screw them")
    return None



if __name__ == '__main__':
    genius = lyricsgenius.Genius(GENIUS_CLIENT_ACCESS)

    if path.exists(LYRICS_CACHE):
        with open(LYRICS_CACHE, "r") as fp:
            lyrics_db = json.loads(fp.read())

    while not currTrackDetails:
        currTrackDetails = spotifyObject.current_playback()
        time.sleep(1)
    
    UpdateProc = UpdateDetails()
    UpdateProc.start()

    server = FlaskServerThread(app)
    server.start()
    sleep(5)
    server.stop()

    send_to_electron['curr_song'] = currTrackDetails
    currSong = currTrackDetails["item"]['name']
    currArtist = currTrackDetails['item']['artists'][0]['name']

    print(f"\n---> Now playing {currSong} by {currTrackDetails['item']['artists'][0]['name']} <---")
    # with open("lyrics.txt", "w") as fp:
    #     fp.write(json.dumps({'curr_song': currTrackDetails, 'lyrics': "Searching for lyrics..."}))
    send_to_electron['curr_song'] = currTrackDetails
    send_to_electron['lyrics'] = "Searching for lyrics..."
    lyrics = None
    try:
        lyrics = getLyrics(genius, currSong, currArtist)
    except:
        pass

    setLyrics(lyrics)
    
    while 1:
        if songWasChanged(currSong, currArtist) or spotifyObject_process[1]:
            spotifyObject_process[1] = False
            currSong = currTrackDetails["item"]['name']
            currArtist = currTrackDetails['item']['artists'][0]['name']

            print(f"\n---> Now playing {currSong} by {currTrackDetails['item']['artists'][0]['name']} <---")
            # with open("lyrics.txt", "w") as fp:
            #     fp.write(json.dumps({'curr_song': currTrackDetails, 'lyrics': "Searching for lyrics..."}))
            send_to_electron['curr_song'] = currTrackDetails
            send_to_electron['lyrics'] = "Searching for lyrics..."

            try:
                lyrics = getLyrics(genius, currSong, currArtist)
            except:
                pass

            setLyrics(lyrics)

        time.sleep(MAIN_UPDATE_FREQ_S)

        # for song timing
        # prog['min'] = int(currTrackDetails['progress_ms'] / 60000)
        # prog['sec'] = int(currTrackDetails['progress_ms'] % 60000 / 1000)
        #
        # if int((time.time() - currtime)*1000) >= 1000:
        #     print(f"{prog['min']}:{prog['sec']}")
        #     currtime = time.time()
