var express = require('express'),
    router = express.Router();

router.get('/', async function (req, res) {

    const { query } = req;
    const { name = "" } = query;

    const response = await req.db.getCheckName(name);


    res.setHeader('Content-Type', 'application/text');
    res.send(response);

});

module.exports = router;