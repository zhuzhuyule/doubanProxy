import config from './config';
import debug from 'debug';
import mongoose from 'mongoose';
import util from 'util';

// connect to mongo db
const mongoUri = config.mongo.host;

mongoose.connect(mongoUri, {
    keepAlive: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

mongoose.connection.on('connected', function () {    
    console.log('Mongoose connection open to ' + mongoUri);  
});   

mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${mongoUri}`);
});

mongoose.connection.on('disconnected', function () {    
    console.log('Mongoose connection disconnected');  
});

// print mongoose logs in dev env
if (config.mongo.isDebug) {
    mongoose.set('debug', (collectionName: string, method: string, query: string, doc: string) => {
        debug('express-mongoose-api')(
            `${collectionName}.${method}`,
            util.inspect(query, false, 20),
            doc
        );
    });
}

module.exports = {
    disconnect: mongoose.disconnect,
};
