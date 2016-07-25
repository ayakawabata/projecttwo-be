var express     = require('express');
var cors        = require('cors');
var bodyParser  = require('body-parser');
var mongodb     = require('mongodb');
var app         = express();
var request     = require('request');
PORT = process.env.PORT || 80;
/* let's add the ability ajax to our server from anywhere! */
app.use(cors());

/* extended:true = put it in an obj */
app.use(bodyParser.urlencoded({extended: true}));

/* MongoClient lets us interface/connect to mongodb */
var MongoClient = mongodb.MongoClient;

/* Connection url where your mongodb server is running. */
var mongoUrl = 'mongodb://heroku_gbkqnwz3:sbe6kj6o9q3q96h3hn4lflq63s@ds035965.mlab.com:35965/heroku_gbkqnwz3';




// /***************** our backend routes ******************************/
//
// /* welcome page */
// app.get('/', function(request, response){
//   response.send("../frontend/index.html");
// });



/***************** routes for `marvel` endpoint ********************/

/* marvel endpoint welcome page */
app.get('/words', function(req, response) {
  // sends to FE & displays at localhost:3000
  response.json({ "description" : "WORDS endpoint"});
  // prints to terminal:
  console.log("words");
}); // end welcome

/* marvel search */
app.post('/words/search', function(req, res) {

  /*
  example of a full query to Marvel:
  http://gateway.marvel.com:80/v1/public/characters?ts=1468935564884&apikey=a84d62b5bd7673df78f442876bf34b83&hash=ffdd7dd65eec8d8f651b74bec7a1d603&name=hulk
  */
  var baseUrl = 'http://api.pearson.com/v2/dictionaries/lasde/entries?search=';
  var endpoint = req.body.endPoint;
  var apiKeyQueryString = "&apikey=";
  var WORDS = process.env.WORDS;
  // var queryString = req.body.queryString; // queryString from fe

  var fullQuery = baseUrl + endpoint + apiKeyQueryString + WORDS;
  console.log("fullQuery:", fullQuery); // prints to terminal

  request({
    url: fullQuery,
    method: 'GET',
    callback: function(error, response, body) {
      console.log(body);
      console.log(response);
      res.send(body); //send res to frontend
    }
  })
}); // end post request

/***************** routes for `favorites` endpoint ********************/

// this is the same as the original Marvel solution //
app.get('/words/showall', function(request, response){
  MongoClient.connect(mongoUrl, function (err, db) {
    var savedCollection = db.collection('words');
    if (err) {
      console.log('Unable to connect to the mongoDB server. ERROR:', err);
    } else {
      /* Get all */
      //  savedCollection.find({ newWord : request.params.name }).toArray(function (err, result) {
      savedCollection.find().toArray(function (err, result) {
        if (err) {
          console.log("ERROR!", err);
          response.json("error");
        } else if (result.length) {
          console.log('Found:', result);
          response.json(result);
        } else { //
          console.log('No document(s) found with defined "find" criteria');
          response.json("none found");
        }
        db.close(function() {
          console.log( "database CLOSED");
        });
      }); // end find

    } // end else
  }); // end mongo connect
}); // end get all

/* add new */
app.post('/words/new', function(request, response){
  // response.json({"description":"add new"});
  console.log("request.body", request.body);

  MongoClient.connect(mongoUrl, function (err, db) {
    var savedCollection = db.collection('words');
    if (err) {
      console.log('Unable to connect to the mongoDB server. ERROR:', err);
    } else {
      // We are connected!
      console.log('Connection established to', mongoUrl);
      console.log('Adding new words...');

      /* Insert */
      var newWord = request.body;
      savedCollection.insert([newWord],function (err, result) {
        if (err) {
          console.log(err);
          response.json("error");
        } else {
          console.log('Inserted.');
          console.log('RESULT!!!!', result);
          console.log("end result");
          response.json(result);
        }
        db.close(function() {
          console.log( "database CLOSED");
        });
      }); // end insert
    } // end else
  }); // end mongo connect
}); // end add new


/* find */
app.get('/words/:name', function(request, response){
  // response.json({"description":"find by name"});
  console.log("request.params: ", request.params);
  MongoClient.connect(mongoUrl, function (err, db) {
    var savedCollection = db.collection('words');
    if (err) {
      console.log('Unable to connect to the mongoDB server. ERROR:', err);
    } else {
      // We are connected!
      console.log('Finding by name... ');
      /* Get */
      savedCollection.find({ newWord : request.params.name }).toArray(function (err, result) {
        if (err) {
          console.log("ERROR!", err);
          response.json("error");
        } else if (result.length) {
          console.log('Found:', result);
          response.json(result);
        } else { //
          console.log('No document(s) found with defined "find" criteria');
          response.json("none found");
        }
        db.close(function() {
          console.log( "database CLOSED");
        });
      }); // end find
    } // end else
  }); // end mongo connect

});

/* delete */
app.delete('/words/:name', function(request, response) {
  // response.json({"description":"delete by name"});

  console.log("request.body:", request.body);
  console.log("request.params:", request.params);

  MongoClient.connect(mongoUrl, function (err, db) {
    var savedCollection = db.collection('words');
    if (err) {
      console.log('Unable to connect to the mongoDB server. ERROR:', err);
    } else {
      // We are connected!
      console.log('Deleting by name... ');

      /* Delete */
      savedCollection.remove(request.params, function(err, numOfRemovedDocs) {
        console.log("numOfRemovedDocs:", numOfRemovedDocs);
        if(err) {
          console.log("error!", err);
        } else { // after deletion, retrieve list of all
          savedCollection.find().toArray(function (err, result) {
            if (err) {
              console.log("ERROR!", err);
              response.json("error");
            } else if (result.length) {
              console.log('Found:', result);
              response.json(result);
            } else { //
              console.log('No document(s) found with defined "find" criteria');
              response.json("none found");
            }
            db.close(function() {
              console.log( "database CLOSED");
            });
          }); // end find

        } // end else
      }); // end remove

    } // end else
  }); // end mongo connect

}); // end delete

/* update */
app.put('/words/:name', function(request, response) {
  // response.json({"description":"update by name"});
  console.log("request.body", request.body);
  console.log("request.params:", request.params);

  var old = {name: request.body.name};
  var updateTo = {name: request.body.newName}

  MongoClient.connect(mongoUrl, function (err, db) {
    var savedCollection = db.collection('words');
    if (err) {
      console.log('Unable to connect to the mongoDB server. ERROR:', err);
    } else {
      // We are connected!
      console.log('Updating by name... ');

      /* Update */
      savedCollection.update(old,updateTo);

      // Wait a sec then fetch the modified doc
      setTimeout(function() {
        savedCollection.find(updateTo).toArray(function (err, result) {
          if (err) {
            console.log("ERROR!", err);
            response.json("error");
          } else if (result.length) {
            console.log('Found:', result);
            response.json(result);
          } else { //
            console.log('No document(s) found with defined "find" criteria');
            response.json("none found");
          }
          db.close(function() {
            console.log( "database CLOSED");
          }); // end db close
        }); // end find
      }, 1000);
    } // end else
  }); // end mongo connect
}); // end update


/* tell our app where to listen */
app.listen(PORT, function(){
  console.log('listen to events on a "port".')
});
