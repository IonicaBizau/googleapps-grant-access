// dependencies
var http = require("http")
  , credentials = require("./credentials")
  , request = require("request")
  ;

http.createServer(function (req, res) {

    // home
    if (req.url === "/") {

        // we've got the access token
        if (typeof ACCESS_TOKEN !== "undefined") {
            res.end("Your access token is: " + ACCESS_TOKEN);
            return;
        }

        // auth url
        var authUrl = "https://accounts.google.com/o/oauth2/auth?";

        // build auth link
        for (var key in credentials) {
            if (key === "client_secret") { continue; }
            authUrl += "&" + key + "=" + credentials[key];
        }

        // redirect
        res.setHeader("location", authUrl);
        res.end();

        return;
    }

    // deny or accept answer?
    if (req.url.indexOf("oauth2callback") !== -1) {

        var url = req.url;

        // error
        if (url.indexOf("error") !== -1) {
            return res.end("Error.");
        }

        // no code
        if (url.indexOf("?code=") === -1) {
            return res.end("Invalid request.");
        }

        // get the code
        var code = url;
        code = code.substring(code.indexOf("?code=") + 6);

        // code is missing
        if (!code) {
            return res.end("Code is missing.");
        }

        // create the form data that will be posted
        var formData = "code=" + code +
                       "&client_id=" + credentials.client_id +
                       "&client_secret=" + credentials.client_secret +
                       "&redirect_uri=" + credentials.redirect_uri +
                       "&grant_type=authorization_code"
          , options = {
                url: "https://accounts.google.com/o/oauth2/token"
              , headers: {'content-type' : 'application/x-www-form-urlencoded'}
              , method: "POST"
              , body: formData
            }
          ;

        // send the request
        request(options, function (err, response, body) {

            // handle error
            if (err) {
                return res.end(err);
            }

            // parse body
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.end(e.message + " :: " + body);
            }

            // error
            if (body.error) {
                return res.end(err);
            }

            // success
            if (body.access_token) {
                ACCESS_TOKEN = body.access_token;
                return res.end("Access token: " + ACCESS_TOKEN);
            }

            return res.end("Something wrong: \n" + JSON.stringify(body, null, 4));
        });

        return;
    }

    res.end("404 - Not found.");
}).listen(3000);

console.log("Open: http://localhost:3000");
