const mongoose = require('mongoose');

const DemotionSchema = new mongoose.Schema({
    caseId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    newRank: {
        type: String,
        required: true
    },
    oldRank: {
        type: String,
        required: true
    }, 
    reason: {
        type: String,
        required: true
    }, 
    notes: {
        type: String,
        default: 'None'
    },
    demotedBy: {
        type: String,
        required: true
    },
    voided: {
        type: Boolean,
        default: false
    },
    voidReason: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Demotion', DemotionSchema);
