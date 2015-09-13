'use strict';

var FDBKeyRange = require('../FDBKeyRange');
var cmp = require('../cmp');

function RecordStore() {
    this.records = [];
}

RecordStore.prototype.get = function (key) {
    if (key instanceof FDBKeyRange) {
        return this.records.find(function (record) {
            return FDBKeyRange.check(key, record.key);
        });
    }

    return this.records.find(function (record) {
        return cmp(record.key, key) === 0;
    });
};

RecordStore.prototype.getAll = function () {
    return this.records;
};

RecordStore.prototype.add = function (newRecord) {
    var i = this.records.findIndex(function (record) {
        return cmp(record.key, newRecord.key) >= 0;
    });

    // If no matching key, add to end
    if (i === -1) {
        i = this.records.length;
    } else {
        // If matching key, advance to appropriate position based on value. This will work both for recordStores where you can have ties in the key (for Indexes, need to then sort by value too) and for recordStores where you can't (ObjectStores)
        while (i < this.records.length && cmp(this.records[i].key, newRecord.key) === 0) {
            if (cmp(this.records[i].value, newRecord.value) !== -1) {
                // Record value >= newRecord value, so insert here
                break;
            }

            i += 1; // Look at next record
        }
    }

    this.records.splice(i, 0, newRecord);
};

RecordStore.prototype.delete = function (range) {
    var deletedRecords = [];

    this.records = this.records.filter(function (record) {
        var shouldDelete = FDBKeyRange.check(range, record.key);

        if (shouldDelete) {
            deletedRecords.push(record);
        }

        return !shouldDelete;
    });

    return deletedRecords;
};

RecordStore.prototype.clear = function () {
    var deletedRecords = this.records;

    this.records = [];

    return deletedRecords;
};

module.exports = RecordStore;