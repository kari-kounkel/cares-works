import test from 'node:test';
import assert from 'node:assert/strict';
import {editableDocumentLines,prepareDraftLines} from '../src/lib/prographicsRehab.js';
test('saved invoice with no-charge shipping reopens and saves without changing cents',()=>{
 const original=[{item:'Printed Decals',desc:'Decals',qty:2500,price:0.59,cost:0},{item:'Shipping',desc:'Shipping',qty:1,price:0,cost:0}];
 const snapshot=structuredClone(original),lines=editableDocumentLines(original);
 assert.equal(lines[1].price,'0');assert.equal(lines[1].cost,'0');
 assert.equal(prepareDraftLines({lines}).subtotal,147500);assert.deepEqual(original,snapshot);
 assert.deepEqual(lines.map(l=>({qty:Number(l.qty),price:Number(l.price)})),original.map(({qty,price})=>({qty,price})));
});
test('missing price is not silently treated as a free line',()=>{
 const lines=editableDocumentLines([{desc:'Shipping',qty:1}]);assert.equal(lines[0].price,'');
 assert.throws(()=>prepareDraftLines({lines}),/Line 1: enter a valid price.*Use 0/);
});
test('invalid saved quantity remains visible and must be corrected',()=>{
 const lines=editableDocumentLines([{desc:'Shipping',qty:0,price:0}]);assert.equal(lines[0].qty,'0');
 assert.throws(()=>prepareDraftLines({lines}),/Line 1: enter a quantity greater than zero/);
});
test('invalid second line identifies the actual row and preserves caller draft',()=>{
 const draft={lines:[{desc:'Cards',qty:'500',price:'.1'},{desc:'Shipping',qty:'1',price:'bad'}]};
 const before=structuredClone(draft);assert.throws(()=>prepareDraftLines(draft),/Line 2: enter a valid price/);assert.deepEqual(draft,before);
});
