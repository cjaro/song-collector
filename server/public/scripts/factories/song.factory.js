app.factory('SongFactory', ['$firebaseAuth', '$http', 'angularFilepicker', '$location', '$routeParams', function ($firebaseAuth, $http, angularFilepicker, $location, $routeParams) {
  var auth = $firebaseAuth();
  var songCollection = {list: []};
  var oneSong = {details: {}};
  var filesUploaded = {list:[]};
  var attachments = {list: []};
  var dropdowns = {formType: [], songType: [], language: [], meter: [], scaleMode: [], teachableElements: []};
  var fileStackAPI = 'AIJdcA3UQs6mAMvmUvaTkz'; // NOTE: create as environment var when move to Heroku
  var client = filestack.init(fileStackAPI);
  var selectedSong = {};
  auth.$onAuthStateChanged(getAllSongs);
  auth.$onAuthStateChanged(getDropdownValues);

  // if($routeParams.id) {  //removed as not being passed in dynamic main page
  //   auth.$onAuthStateChanged(getOneSong);
  //   auth.$onAuthStateChanged(getAttachments);
  // }

  // on click function that redirects us to the card's full view
  function showSong(id) {
    // $location.url('/edit/' + id); //removed for dynamic main page
    getAttachments(id);
    getOneSong(id);
  }

  // gets all songs from the db
  function getAllSongs() {
    var firebaseUser = auth.$getAuth();
    if(firebaseUser) {
      firebaseUser.getToken().then(function (idToken) {
        $http({
          method: 'GET',
          url: '/songs',
          headers: {
            id_token: idToken
          }
        }).then(function(response) {
          songCollection.list = response.data;
        });
      });
    } else {
      songCollection = {};
      console.log('cannot get when not logged in');
    }
  }

  // get's one song from the database based on the song's ID grabbed from $routeParams
  function getOneSong(songId) {
    var firebaseUser = auth.$getAuth();
    if(firebaseUser) {
      firebaseUser.getToken().then(function (idToken) {
        $http({
          method: 'GET',
          url: '/songs/singleSong/' + (typeof(songId) == "number" ? songId : $routeParams.id),
          headers: {
            id_token: idToken
          }
        }).then(function(response) {
          oneSong.details = response.data;
          oneSong.details.rhythmArray = prepareRhythmForFont(oneSong.details.rhythm_note); //converts the rhythm string from db to an array for displaying correct portions as MusiSync font
          oneSong.details.extractableRhythmArray = prepareExtractableRhythmForFont(oneSong.details.extractable_rhythms_note); //"" as above but for extractable rhythms
        });
      });
    } else {
      songCollection = {};
      console.log('cannot get when not logged in');
    }
  }

  // send file to FileStack and db at the same time
  function fileUpload() {
    console.log('file sending to FileStack...');
    client.pick(
      {
        accept: 'image/*',
        fromSources: ['local_file_system', 'googledrive', 'imagesearch', 'dropbox'],
        maxFiles: 1,
        // storeTo: {
        // location: 's3'
        // }
      }).then(function(result) {
        console.log('file uploaded, now sending to database... ', result.filesUploaded);
        filesUploaded.list = result.filesUploaded;
        var firebaseUser = auth.$getAuth();
        if(firebaseUser) {
          firebaseUser.getToken().then(function (idToken) {
            console.log('firebase user authenticated');
            $http({
              method: 'POST',
              url: '/songs/addImage/' + $routeParams.id,
              data: result.filesUploaded,
              headers: {
                id_token: idToken
              }
            }).then(function() {
              console.log('file posted to database!');
            });
          });
        } else {
          console.log('not logged in!');
        }
      });
    }

    function getAttachments(songId) {
      console.log('hitting get attachments function');
      var firebaseUser = auth.$getAuth();
      if(firebaseUser) {
        firebaseUser.getToken().then(function (idToken) {
          console.log('firebase user authenticated');
          $http({
            method: 'GET',
            url: '/songs/getAttachments/' + (typeof(songId) == "number" ? songId : $routeParams.id),
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            attachments.list = response.data;
            console.log('getting attachments!', attachments.list);
          });
        });
      } else {
        console.log('not logged in!');
      }
    }

    function getDropdownValues() {
      console.log('getting dropdowns?');
      var firebaseUser = auth.$getAuth();
      if(firebaseUser) {
        firebaseUser.getToken().then(function (idToken) {
          $http({
            method: 'GET',
            url: '/dropdowns/form-type',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.formType = response.data;
          });
          $http({
            method: 'GET',
            url: '/dropdowns/song-type',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.songType = response.data;
          });
          $http({
            method: 'GET',
            url: '/dropdowns/language',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.language = response.data;
          });
          $http({
            method: 'GET',
            url: '/dropdowns/meter',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.meter = response.data;
          });
          $http({
            method: 'GET',
            url: '/dropdowns/scale-mode',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.scaleMode = response.data;
          });
          $http({
            method: 'GET',
            url: '/dropdowns/teachable-elements',
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            dropdowns.teachableElements = response.data;
          });
        });

      } else {
      }
    }

    function saveNewSong(newSong) {
      console.log('newSong', newSong);
      var firebaseUser = auth.$getAuth();
      if(firebaseUser) {
        firebaseUser.getToken().then(function (idToken) {
          $http({
            method: 'POST',
            url: '/songs/newSong',
            data: newSong,
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            console.log(response.data);
            getAllSongs();
          });
        });
      } else {
        console.log('not logged in!');
      }
    }

    function deleteSong(songId) {
      var firebaseUser = auth.$getAuth();
      if(firebaseUser) {
        return firebaseUser.getToken().then(function (idToken) {
          $http({
            method: 'DELETE',
            url: '/songs/removeSong/' + songId,
            headers: {
              id_token: idToken
            }
          }).then(function(response) {
            getAllSongs();
          });
        });
      } else {
        console.log('not logged in!');
      }
    }

    // remove Image function
    // function removeImage() {
    //   var storedurl = filesUploaded.list[0].url;
    //   console.log(filesUploaded.list[0].url);
    //   var handle = storedurl.substr(storedurl.lastIndexOf("/") + 1);
    //   console.log(handle);
    //   client.remove(handle);
    //   console.log('file removed successfully: ' + storedurl);
    // }

    function prepareRhythmForFont(rhythmString) {
      if(rhythmString.length===0) {
        return [];
      } else {
        var textString = '';
        var newString = rhythmString;
        if (rhythmString.indexOf("internal")>=0 || rhythmString.indexOf("(internal)")>=0) {
          newString = newString.replace('internal', '');
          newString = newString.replace('(internal)', '');
          textString += 'internal ';
        }
        if (rhythmString.indexOf("eighth")>=0) {
          newString = newString.replace('eighth', '');
          textString += 'eighth ';
        }
        if (rhythmString.indexOf("anacrusis")>=0 || rhythmString.indexOf("anacrusic")>=0) {
          newString = newString.replace('anacrusis', '');
          newString = newString.replace('anacrusic', '');
          textString += 'anacrusis ';
        }
        if (rhythmString.indexOf("all syncopated")>=0) {
          newString = newString.replace('all syncopated', '');
          textString += 'all syncopated ';
        }
        return [newString, textString];
      }
    }

    function prepareExtractableRhythmForFont(extractableRhythmString) {
      if(extractableRhythmString.length===0) {
        return [];
      } else {
        var resultArray = extractableRhythmString.split(/\(([^)]+)\)/); //checks for Regex of anything between "(" and ")", splits on these values

        for (var i = 0; i < resultArray.length; i++) {
          if(i%2!==0) {
            resultArray[i] = '(' + resultArray[i] + ')';
          }
        }

        return resultArray;
      }

    }

    return {
      showSong: showSong,
      getAllSongs: getAllSongs,
      songCollection: songCollection,
      getOneSong: getOneSong,
      oneSong: oneSong,
      fileUpload: fileUpload,
      filesUploaded: filesUploaded,
      getAttachments: getAttachments,
      attachments: attachments,
      dropdowns: dropdowns,
      saveNewSong: saveNewSong,
      deleteSong: deleteSong,
      prepareRhythmForFont: prepareRhythmForFont,
      prepareExtractableRhythmForFont: prepareExtractableRhythmForFont
      // removeImage: removeImage
    };
  }]);
