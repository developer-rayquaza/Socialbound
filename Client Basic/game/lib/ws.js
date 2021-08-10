
var Server = require('./server');
var SocketConnection = require('./socketconnection');
var http = require('http').createServer();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var exphbs = require('express-handlebars');
var mysql = require('mysql');
var md5 = require('md5');
var helmet = require('helmet');
var constants = require('constants');
var fs = require('fs');
var tls = require('tls');
var url = require('url');
var WebSocketServer = require('ws').Server;
var Logger = require('./logger');

var hbs = exphbs.create({
    defaultLayout: 'main',
    partialsDir: [
        'views/partials/'
    ]
});
// WS
module.exports = class WS extends Server {
    constructor(port) {
        super(port);
        var self = this;
        this.db = null;
        this._counter = 0;
        this._httpServer = http;
        this._app = express();
        this._app.set('env', 'production');
        this._app.disable('x-powered-by');
        this._app.use(helmet());
        this._app.use(cookieParser('xgamedev'));
        this._app.use(bodyParser.urlencoded({
            extended: false
        }));
        this._app.use(bodyParser.json());
        this._app.use("/", function(req, res) {
            res.send("hi");
        });
        this._httpServer.on('request', this._app);
        this._httpServer.listen(port, function() {
            const { port } = http.address();
            const { vps } = process.env;
            const st = vps == '1' ? 'VPS' : vps == '3' ? 'LINUX' : 'LOCAL';
            
            Logger.green("Compiled successfully!");
            Logger.green("");
            Logger.blue("            .c:.                  ''           ");    
            Logger.blue("            'OWXx:.              .O0,          ");    
Logger.blue("            'OMWWWXx:.          .dWWk,,cll;.       ");
Logger.blue("            'OMXockXWXOkkkkkkkkk0NMMWNWNXNW0:      ");
Logger.blue("           .:KMK,  'cxkkkkkkkkkkkkkkkkd;.:KM0'     ");
Logger.blue("     .,:lxOKNWNk'   .;llllll:.   ..';:cccoKMX;     ");
Logger.blue("     .lKMMW0o:'.     :OXX0kd,..:dkKXNWMMWMMMX;     ");
Logger.blue("       .oKWXo.        .... .,xXWNNOkKkxKklkXK;     ");
Logger.blue("         'OWWk.          ..lXW0l,,. '. '.  .;.     ");
Logger.blue("         ,0WX:           ,d0MX:                    ");
Logger.blue("        ,0MNo..           .lXW0l.        .;.       ");
Logger.blue("       ,0MMWXKK0xl,.        ,xXWXkoc;,,:dK0;       ");
Logger.blue("       ;oooood0WMMWXOdc,.     'cx0XNWNWWMMk.       ");
Logger.blue("              cNM0odOXNNKkxo:'.  ..';:oKMNc        ");
Logger.blue("              cNMd.  .,cxKWMMNKOdc;'.;xNWk.        ");
Logger.blue("              cNMd.      cKNMKkOKNWNNWN0l.         ");
Logger.blue("              cNMd.      ,d0M0, .':cc:,.           ");
Logger.blue("              cNMd.       .cNWO;                   ");
Logger.blue("              cNMd.         :0WNkl:,'.             ");
Logger.blue("              cNWd.          .:x0NNNXc             ");
Logger.blue("              .:c'              ..,;:.             ");
            Logger.br();
            Logger.blue("             Welcome to SocialBound!");
            Logger.white("           Developed by lnferno/Alex")
            Logger.br();
            Logger.white("   Server/WS port:   " + port);
            Logger.white("   Server Type   :   " + st);
        });
        this._wss = new WebSocketServer({
            server: http
        });
        this._wss.on('connection', function connection(ws) {
            var c = new SocketConnection(self._createId(), ws, self);
            if (self.connection_callback) {
                self.connection_callback(c);
            }
            self.addConnection(c);
        });
    }

    _createId() {
        return '5' + Math.floor(Math.random() * 99) + '' + (this._counter++);
    }
};