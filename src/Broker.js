var gen = require('../node_modules/kwbl-gen'); 
var amqp = require('../node_modules/amqp'); //rabbit mq
var connection = amqp.createConnection({host: '10-60-8-149-pure.kwebbl.dev'}); 

/* constructor for Broker
* var countOfMsg -- general amount of messages have to be sent
* var portionOfMsg - how many messages have to be sent during 1 iteration
* var arrOfMsg - array of messages have to be sent
*/

function Broker(countOfMsg, portionOfMsg) {
    this.countOfMsg = countOfMsg || 10;
    this.portionOfMsg = portionOfMsg || 2;
    this.arrOfMsg = [];
    //this.pairOfMsg = this.setPairOfMsg();
}

// return type (start, stop or error)
Broker.prototype.checkTypeOfMsg = function(flag) {
    var type;
    if (flag == 'start' || flag == 'stop') {
        type = flag;
    } else {
        this.catchTheError ("Broker.checkTypeOfMsg(): Incorrect param for creating msg. Should be 'start', 'stop' or nothing for both");
        type = 'error';
    }
        //console.log ('type = ' + type);
    return type;
};

//return true
Broker.prototype.catchTheError = function(value) {
    console.log(value);
    return true;
};

//prepare an array [routingKey, playload] for one message (start or stop)
//return array msg
Broker.prototype.makeMsg = function (flag) {
    var msg = [];
    var callId = gen.uuid();
    var type = this.checkTypeOfMsg(flag);
    switch (type){
        case 'start': {
            msg[0] = "call.start";
            break;
        }
        case 'stop': {
            msg[0] = "call.stop";
            break;
        }
        case 'error':    
        default: {
            this.catchTheError ("Broker.makeMsg(): Incorrect parametr for message. Should be 'start' || 'stop'");
        }
    }
    msg[1] = {playload: { 
                call_id:  callId, 
                timestamp: {}
                }
             }
    return msg;
}

//prepare the whole pair of messages for sending (incl. start and stop keys)
Broker.prototype.setPairOfMsg = function () {
    var pairMsg = [];
    var duration = {};
    pairMsg[0] = this.makeMsg('start');
    pairMsg[0][1]["playload"]["timestamp"] = gen.couchTimeStamp();
    
    pairMsg[1] = this.makeMsg('stop');
    duration = gen.duration();
    pairMsg[1][1]["playload"]["timestamp"] = gen.couchTimeStamp(duration*1000);
    return pairMsg;
}

//send messages to Exchange                        
Broker.prototype.sendMsg = function () {
    var self = this;  
    var intervalId; 
    var numberOfIterations = this.countOfMsg/this.portionOfMsg; // how many iterations are needed
    var counterOfIterations = 0; //
    
    /* function interval(send)
    *
    * set intervals for sending messages
    * parameter: function's name 'send'
    */
    
    var interval = function (send) {
        console.log ('Sending ' + self.countOfMsg + ' messages. ' + self.portionOfMsg + ' per one iteration');
        intervalId = setInterval (callToSend(), 500);
        
        /* function callToSend(counter) ---> callback for setInterval
        * 
        * for each portion of messages prepare the pairs of start and stop messages (pairOfMsg)
        * (portion = ammount of messages are sending per 1 iteration)
        *
        * and call 'send' function to send them to exchange.
        *
        * Stop sending if general countOfMsg is reached
        * (all portions has been sent)
        */
        function callToSend() {
            return function () {
               if (counterOfIterations < numberOfIterations) {
                    for (var i=0; i<self.portionOfMsg/2; i++){
                        var message = self.setPairOfMsg();
                        send(message);
                    }
                    console.log (counterOfIterations + 1 + ') ' + self.portionOfMsg + ' messages have been sent');
                    if (counterOfIterations == numberOfIterations-1) {
                        console.log ('Finished');
                    }
                }
                else {
                   clearInterval(intervalId);
                    
                }
                counterOfIterations++;
             }
        }
    }
    
    return connection.on ('ready', function () {
        console.log('connection.on is ready');
        //to set messages
        connection.exchange('test_stud', {autoDelete: false}, function(exchange) {   
            //sending to exchange pair of messages (start and stop)
            var send = function (messages) {
                for (var i=0; i<messages.length; i++) {
                    var msg = messages[i];
                    exchange.publish(msg[0], msg[1]);
                    //console.log('Msg was published: routingKey = ' + msg[0] + ' playload = ' + msg[1]);
                }
            }
            interval(send);
        });
        
        /*connection.queue("test_stud_queue", function(queue){
        console.log('inside queue');
        queue.bind('test_stud', '#');
        queue.subscribe(function (message, headers, deliveryInfo, messageObject) {
            console.log("Got a message with routing key " + deliveryInfo.routingKey);
            });
                   
        })*/
    });
}



exports.Broker = Broker;      