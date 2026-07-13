const mongoose = require('mongoose');

const BotAccessSchema = new mongoose.Schema({
    roleId: {
        type: String,
        required: true
    }
}, { strict: true });

module.exports = mongoose.model('BotAccess', BotAccessSchema);
