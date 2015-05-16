var app = angular.module('myApp', ["firebase", 'youtube-embed']);

app.filter('secondsToDateTime', [ function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}]) // http://stackoverflow.com/questions/28394572/angularjs-seconds-to-time-filter


app.controller('mainCtrl', ['$scope', "$firebase", "$interval", function($scope, $firebase, $interval){

    var ref = new Firebase("https://brilliant-torch-7744.firebaseio.com/"); 
    var mainObj = $firebase(ref).$asObject();

    mainObj.$bindTo($scope, "data").then(function() {
        setPlayLists();
        setSongs();
        $scope.jukebox.ctrl.newId($scope.currentSong.url);  // https://www.youtube.com/watch?v=rg2_PZ0kgBo
        $scope.$broadcast('loadYT', true);
    });

    function setPlayLists(){
        var _PlayList = Object.keys( $scope.data )
        $scope.playlists = _PlayList.slice(2, _PlayList.length);
        $scope.currentPlaylist = $scope.playlists[0]; 
        return true;
    };
    
    function setSongs(){
        $scope.songs = $scope.data[$scope.currentPlaylist]
        $scope.currentSong = $scope.songs.current();   //present playing song init
        return true;
    };
    
    var rindex = [];
    
    (function init(){
        $scope.newSong = {
           'title': "",
           'artist': "", 
           'url': "",
           'type': "youtube",
        };

        $scope.jukebox = {
            state: {}
        }

        $scope.random = false;

        $scope.randomize = function(){
            $scope.random = !$scope.random;
            if($scope.random){
                rindex = $scope.songs.keys().suffle();
            }
        };
    }());

   ///////////////////////////// jukebox ////////////////////////////////

    $scope.jukebox.state = {
        isPlay: function(){
            if($scope.jukebox.state.now === 1){return true};
            return false;
        },
        isMuted: function(){
            return $scope.ytPlayer.isMuted();
        }
    }
    
    $scope.$on('onPlayerReady', function(event, data){
        $scope.jukebox.state.runTime = data.length;
        $scope.jukebox.state.progress = function(){
            return ($scope.ytPlayer.getCurrentTime() / $scope.jukebox.state.runTime * 100) + '%'
        }
        $interval( function(){ $scope.ytPlayer.getCurrentTime() }, 500, false);
        $scope.jukebox.ctrl.play();
    });
    
//    -1 –시작되지 않음, 0 – 종료, 1 – 재생 중, 2 – 일시중지, 3 – 버퍼링, 5 – 동영상 신호
    $scope.$on('onPlayerStateChange', function (event, data) {
        
        if(data.playerState == 0){ $scope.jukebox.ctrl.next(); }
        $scope.$apply(function(){
            $scope.jukebox.state.now = data.playerState;
        })
        
    });
    
    $scope.$on('onPlayerError', function (event, data) {
        $scope.jukebox.ctrl.next();
    });
        
    $scope.jukebox.ctrl= {
        newId: function(url){
            $scope.ytPlayerData.id = $scope.youtube_url2id(url)
        },
        play: function(){
            $scope.ytPlayer.playVideo();
        },
        pause: function(){
            $scope.ytPlayer.pauseVideo(); 
            progressBar.stop();
        },
        previous: function(){
            if($scope.random){
                var _idx = rindex.prev()
                $scope.songs.setnow(_idx);
                $scope.currentSong = $scope.songs.current();
            } else {
                $scope.currentSong = $scope.songs.prev();
            }
            $scope.jukebox.ctrl.newId($scope.currentSong.url)
         //   $scope.jukebox.ctrl.play();
        },
        next: function(){
            if($scope.random){
                var _idx = rindex.next()
                $scope.songs.setnow(_idx);
                $scope.currentSong = $scope.songs.current();
            } else {
                $scope.currentSong = $scope.songs.next();
            }
            $scope.jukebox.ctrl.newId($scope.currentSong.url)
         //   $scope.jukebox.ctrl.play();
        },
        playThis: function(index){
            $scope.currentSong = $scope.songs[index];
            $scope.songs.setnow(index);
            $scope.jukebox.ctrl.newId($scope.currentSong.url)
         //   $scope.jukebox.ctrl.play();
        },
        mute: function(){
            if( $scope.jukebox.state.isMuted() ){
                $scope.ytPlayer.unMute();
            } else {
                $scope.ytPlayer.mute();
            }
        }
    }
    
    
   ///////////////////////////// playlist ////////////////////////////////
    
    $scope.reloadPlayList = function(listname){
        $scope.currentPlaylist = listname;
        $scope.songs = $scope.data[$scope.currentPlaylist];
        $scope.editingPlayList = false;
    };
    
    $scope.addPlayList = function(event){
        if(event.keyCode != 13){return};
        if($scope.newPlaylist == ""){return};
        $scope.data[$scope.newPlaylist] = [];
        setPlayLists();
        delete $scope.newPlaylist;
    };
    
    
    $scope.editPlayList = function(){
        $scope.editingPlayList = true;
        $scope.newNamedPlaylist = $scope.currentPlaylist;
    }
    
     $scope.renamePlayList = function(event){
        if(event.keyCode != 13){return};
        if($scope.newNamedPlaylist == ""){return};
        if($scope.newNamedPlaylist == $scope.currentPlaylist){return}; 
        $scope.data[$scope.newNamedPlaylist] = $scope.data[$scope.currentPlaylist];
        delete $scope.data[$scope.currentPlaylist];
        setPlayLists();
        $scope.currentPlaylist = $scope.newNamedPlaylist;
        setSongs();
        $scope.editingPlayList = false; 
    };
    
    $scope.deletePlayList = function(){
        if(confirm( "이 플레이리스트를 정말 지우시렵니까? 다시 복구할 수 없습니다.") ){
            delete $scope.data[$scope.currentPlaylist];
            setPlayLists();
            $scope.currentPlaylist = $scope.playlists[0]; 
            setSongs();
        };
    };

   ///////////////////////////// song ////////////////////////////////
    
    $scope.add = function(){
        $scope.data[$scope.currentPlaylist].push({
           'title': $scope.newSong.title,
           'artist': $scope.newSong.artist,
           'url': $scope.newSong.url,
           'type': "youtube",
           'ord': $scope.songs.length
         });
        $scope.newSong = {
           'title': "",
           'artist': "", 
           'url': "",
           'type': "youtube",
        };
        setSongs();
    };

    $scope.delete = function(song){
        if( confirm("이 노래를 정말 지우시렵니까? 다시 복구할 수 없습니다.") ){
            var index = $scope.data[$scope.currentPlaylist].indexOf(song);
            $scope.data[$scope.currentPlaylist].splice(index, 1);
            setSongs();
        }
    };

    var editingSong = "";
    
    $scope.edit = function(song){
        $scope.updatedSong = song;
        editingSong = song;
        $scope.editing = true; 
    };

    $scope.update = function(updatedSong){
        var index = $scope.data[$scope.currentPlaylist].indexOf(editingSong);
        $scope.data[$scope.currentPlaylist][index] = $scope.updatedSong;
        setSongs();
        $scope.editing = false; 
    };

    $scope.up = function(song){
        var i = $scope.data[$scope.currentPlaylist].indexOf(song);
        if(i==0){
            return false
        } else {
            var j = i - 1 ;
            var prev = $scope.data[$scope.currentPlaylist][j];
            $scope.data[$scope.currentPlaylist][j] = song;
            $scope.data[$scope.currentPlaylist][i] = prev;
        }
        setSongs();
    };

    $scope.down = function(song){
        var i = $scope.data[$scope.currentPlaylist].indexOf(song);
        if(i==$scope.songs.length-1){
            return false
        } else {
            var j = i + 1;
            var next = $scope.data[$scope.currentPlaylist][j];
            $scope.data[$scope.currentPlaylist][j] = song;
            $scope.data[$scope.currentPlaylist][i] = next;
        }
        setSongs();
    };

    
    //http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
    $scope.youtube_url2id = function(url){ 
        var ytRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(ytRegExp);
        if (match && match[7].length==11){
            return match[7]
        }else{
            return "ERROR_URL_ID"
        }
    }

    
}]);