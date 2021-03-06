//----------------------------------------------------------------------------------------------------------------------
// Utilities to make express routes use less boilerplate.
//----------------------------------------------------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

//----------------------------------------------------------------------------------------------------------------------

/**
 * Basic request logging
 *
 * @param {*} logger - The logger to use.
 *
 * @returns {Function} Returns a middleware function to perform logging.
 */
function buildBasicRequestLogger(logger)
{
    return (request, response, next) =>
    {
        logger.debug(`${ request.method } '${ request.url }'`);
        next();
    }; // end loggerFunc
} // end buildBasicRequestLogger

/**
 * Basic error logging
 *
 * @param {*} logger - The logger to use.
 *
 * @returns {Function} Returns a middleware function to perform logging.
 */
function buildBasicErrorLogger(logger)
{
    return (error, request, response, next) =>
    {
        const childLogger = logger.child({
            request: {
                id: request.id,
                method: request.method,
                url: request.url,
                body: request.body,
                query: request.query
            }
        });

        if(response.statusCode < 500)
        {
            childLogger.warn(`${ request.method } ${ response.statusCode } '${ request.url }': ${ error.stack }`);
        }
        else
        {
            childLogger.error(`${ request.method } ${ response.statusCode } '${ request.url }': ${ error.stack }`);
        } // end if

        next(error);
    }; // end loggerFunc
} // end buildBasicErrorLogger

/**
 * Build a custom error logger
 *
 * @param {*} logger - The logger to use.
 *
 * @returns {Function} Returns a middleware function to perform logging.
 */
function buildErrorHandler(logger)
{
    // If we don't have 4 parameters, this function literally doesn't work.
    // eslint-disable-next-line no-unused-vars
    return (error, request, response, next) =>
    {
        let errorJSON = {};
        if(typeof error.toJSON == 'function')
        {
            errorJSON = error.toJSON();
        }
        else
        {
            errorJSON = {
                name: error.constructor.name,
                message: error.message,
                code: error.code,
                error
            };
        } // end if

        response.status(error.statusCode || 500);

        if(logger)
        {
            const childLogger = logger.child({
                request: {
                    id: request.id,
                    method: request.method,
                    url: request.url,
                    body: request.body,
                    query: request.query
                }
            });

            if(response.statusCode < 500)
            {
                childLogger.warn(`${ request.method } ${ response.statusCode } '${ request.url }': ${ error.stack }`);
            }
            else
            {
                childLogger.error(`${ request.method } ${ response.statusCode } '${ request.url }': ${ error.stack }`);
            } // end if
        } // end if

        response.json(errorJSON);
    }; // end apiErrorHandler
} // end buildErrorHandler

/**
 * Serves index page.
 *
 * @param {*} request - Express request.
 * @param {*} response - Express response.
 */
function serveIndex(request, response)
{
    response.setHeader('Content-Type', 'text/html');
    fs.createReadStream(path.resolve(__dirname, '..', '..', '..', 'dist', 'index.html')).pipe(response);
} // end serveIndex

/**
 * Either serve 'index.html', or run json handler
 *
 * @param {*} response - Express response.
 * @param {Function} jsonHandler - Handler function for the json portion of the request.
 * @param {boolean} skipAuthCheck - Should we skip checking authentication?
 */
function interceptHTML(response, jsonHandler, skipAuthCheck)
{
    response.format({
        html: serveIndex,
        json(request, resp, next)
        {
            if(!skipAuthCheck || request.isAuthenticated())
            {
                Promise.resolve(jsonHandler(request, resp)).catch(next);
            }
            else
            {
                resp.status(401).json({
                    name: 'NotAuthorized',
                    message: `Not authorized.`
                });
            } // end if
        }
    });
} // end interceptHTML

/**
 * Ensures that the user is authenticated, or it returns a 401.
 *
 * @param {*} request - Express request.
 * @param {*} response - Express response.
 * @param {Function} next - Express next function.
 */
function ensureAuthenticated(request, response, next)
{
    if(request.isAuthenticated())
    {
        next();
    }
    else
    {
        response.status(401).json({
            name: 'NotAuthorized',
            message: `Not authorized.`
        });
    } // end if
} // end ensureAuthenticated

/**
 * TODO: Remove usages of this in favor of `wrapAsync` and `errorHandler`.
 *
 * @param {Function} handler - Express router function.
 *
 * @returns {Function} - Express router function.
 */
function promisify(handler)
{
    return (request, response) =>
    {
        handler(request, response)
            .then((results) =>
            {
                if(!response.finished)
                {
                    response.json(results);
                } // end if
            })
            .catch((error) =>
            {
                console.error(error.stack || error.message);

                response.status(500).json({
                    name: error.constructor.name,
                    message: error.message,
                    error
                });
            });
    };
} // end promisify

/**
 * Wraps a router function in an async handler.
 *
 * @param {Function} handler - Express router function.
 *
 * @returns {Function} - Express router function.
 */
function wrapAsync(handler)
{
    return function(req, res, next)
    {
        // Make sure to `.catch()` any errors and pass them along to the `next()` middleware in the chain
        handler(req, res, next).catch(next);
    };
} // ebd wrapAsync

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    requestLogger: buildBasicRequestLogger,
    errorLogger: buildBasicErrorLogger,
    errorHandler: buildErrorHandler,
    interceptHTML,
    serveIndex,
    ensureAuthenticated,
    promisify,
    wrapAsync
}; // end exports

//----------------------------------------------------------------------------------------------------------------------
