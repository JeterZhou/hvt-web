'use strict';
const cloudbase = require('@cloudbase/node-sdk');
const { createHandler } = require('./logic.js');
const db = cloudbase.init({}).database();
const table = db.collection('hvt_rooms_v3');
const unwrap = result => Array.isArray(result?.data) ? result.data[0] : result?.data;
const store = {
  async add(entry) { await table.add(entry); },
  async get(code) { return unwrap(await table.doc(code).get()); },
  async list() { const result = await table.orderBy('createdAt', 'desc').limit(100).get(); return result?.data || []; },
  async transact(code, change) {
    return db.runTransaction(async tx => {
      const doc = tx.collection('hvt_rooms_v3').doc(code);
      const entry = unwrap(await doc.get());
      if (!entry) throw Error('没有找到房间。');
      const output = change(entry);

      // 不把数据库系统字段 _id 写回
      const { _id, ...entryData } = entry;
      
      await doc.set(entryData);
      
      return output;
    });
  },
};
const handle = createHandler({ store });
exports.main = async event => handle(event);
