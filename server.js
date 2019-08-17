'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGOLAB_URI,{ useNewUrlParser: true });
var db = mongoose.connection;
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended:false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

 function hostName(host){
   var hostname="";
   for(var i=0;i<host.length;i++){
      if(host[i] != host[host.length -1]){
        hostname += host[i] + ".";
      }
      else{
        var regex2 = /[a-z]/;
        var lastString = host[i];
        var special = true;
        for(var j=0;j<lastString.length;j++){
          if(!regex2.test(lastString[j])){
            special = false;
            hostname += lastString.substring(0,j);
            break;
          }
        }
        if(special)
          hostname += lastString;
      }
    }
   return hostname;
 } 
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

var schema = mongoose.Schema;
var urlSchema = new schema({url: String, id: Number});
var URL = mongoose.model('URL',urlSchema);

app.post('/api/shorturl/new',function(req,res){
  var url = req.body.url;
  var regex = /^http\:\/\/|https\:\/\//;
  if(regex.test(url)){
    var host = url.replace(regex,"");
    host = host.split(".")
    var hostname = hostName(host);
    
    dns.lookup(hostname,(error,address,family)=>{
      if(error)
        res.json({"error": "invalid URL"});
      else{
        //res.json({"status": "found", "hostname": hostname});
        URL.find().exec((err,data)=>{
          var specificObj = data.filter(obj => obj.url == url);
          if(specificObj.length == 0){
            var validurl = new URL({url: url, id:data.length});
            validurl.save((err,data)=>{
              if(err)
                res.json({"error": err});
              else{
                res.json({"original_url": data.url, "short_url": data.id});
              }
            });
          }
          else{
            //res.json({"original_url": specificObj.url, "short_url": specificObj.id});
            res.json({"original_url": specificObj[0].url, "short_url": specificObj[0].id});
          }
        });
        /*URL.find().deleteMany((err,data) =>{
          if(err)
            res.json(err);
          res.json({"deleted": data});
        });*/
      }
    });
  }
  else{
    res.json({"error": "invalid URL"});
  }
});

app.get('/api/shorturl/:number',function(req,res){
  var id = req.params.number;
  URL.findOne({id:id},function(err,data){
    if(data == null){
      res.json({"error":"No short url found for given input"});
    }
    else{
      res.redirect(data.url);
    }   
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
