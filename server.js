var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs');


var app = express();

// body-parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(multiparty());

app.use(function(req, res, next){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    next();
});

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
        'instagram',
         new mongodb.Server('localhost', 27017, {}),
         {}
        );

console.log('escutando porta ' + port);

app.get('/', function(req, res){
    res.send({msg:'teste'});
});

//POST
app.post('/api', function(req, res){
    
    //libera a api somente para o dominio localhost:80
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:80');
    //libera a api para qualquer dominio
//    res.setHeader('Access-Control-Allow-Origin', '*');
    
    var date = new Date();
    var time_stamp = date.getTime();
    
    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;
    
    
    
    fs.rename(path_origem, path_destino, function(err){
        
        if (err) {
            res.status(500).json({error:err});
            return;
        }
        
        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }
        
        db.open(function(err, mongoclient){
            mongoclient.collection('postagens', function(err, collection){
                collection.insert(dados, function(err, records){
                    if(err){
                        res.json({'status': 'erro'});
                    }else{
                        res.json({'status': 'inclusao realizada com sucesso'});
                    }
                    mongoclient.close();
                });
            });
        });
    });
    
});

//GET all
app.get('/api', function(req, res){
    
    //libera a api somente para o dominio localhost:80
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:80');
    //libera a api para qualquer dominio
//    res.setHeader('Access-Control-Allow-Origin', '*');
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find().toArray(function(err, results){
                if(err){
                    res.json(err);
                }else{
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });
});


app.get('/imagens/:imagem', function(req, res){
    
    var img = req.params.imagem;
   
    fs.readFile('./uploads/'+img, function(err, conteudo){
        if (err) {
            res.status(400).json(err);
            return;
        }
        
        res.writeHead(200, { 'content-type' : 'image/jpg' });
        res.end(conteudo);
        
    });
    
});

//GET by ID (ready)
app.get('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find(objectId(req.params.id)).toArray(function(err, results){
                if(err){
                    res.json(err);
                }else{
                    //status 500 para retorno com o documento
                    res.status(500).json(results);
                }
                mongoclient.close();
            });
        });
    });
});


//PUT by ID (update)
app.put('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                    { _id : objectId(req.params.id) },
                    { $push : 
                            { 
                                comentarios : {
                                    id_comentario : new objectId() ,
                                    comentario : req.body.comentario
                                }
                            }
                    },
                    {},
                    function(err, records){
                        if(err){
                            res.json(err);
                        }else{
                            res.json(records);
                        }
                        mongoclient.close();
                    }
                );
        });
    });
});

//DELETE by ID (remover)
app.delete('/api/:id', function(req, res){
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                   {  },
                   { $pull : 
                           { 
                               comentarios : {
                                   id_comentario : objectId(req.params.id)
                               }
                           }
                   },
                   {multi: true},
                   function(err, records){
                       if(err){
                           res.json(err);
                       }else{
                           res.json(records);
                       }
                       mongoclient.close();
                   }
               );
        });
    });
    
    /*db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.remove(
                    { _id : objectId(req.params.id) },
                    function(err, records){
                        if(err){
                            res.json(err);
                        }else{
                            res.json(records);
                        }
                        mongoclient.close();
                    }
                );
        });
    });*/
});

