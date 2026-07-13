const mongoose = require('mongoose');

const InfractionSchema = new mongoose.Schema({
  userId: String,
  punishment: String,
  punishmentRole: String, 
  reason: String,
  notes: String,
  caseId: String,
  date: { type: Date, default: Date.now },
  voided: { type: Boolean, default: false },
  voidReason: { type: String, default: null }
});

module.exports = mongoose.model('Infraction', InfractionSchema);
  