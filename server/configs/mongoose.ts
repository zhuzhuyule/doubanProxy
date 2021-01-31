import config from './config';
import debug from 'debug';
import mongoose from 'mongoose';
import util from 'util';
import { getLogger } from '@utils/logger';

const logger = getLogger('mongodb');
// connect to mongo db
const mongoUri = config.mongo.host;

mongoose.connection.on('connected', function () {    
    logger.info('Mongoose connection open to ' + mongoUri);  
});   

mongoose.connection.on('error', () => {
    logger.fatal(`unable to connect to database: ${mongoUri}`);
});

mongoose.connection.on('disconnected', function () {    
    logger.warn('Mongoose connection disconnected');  
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

mongoose.connect(mongoUri, {
    keepAlive: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});
