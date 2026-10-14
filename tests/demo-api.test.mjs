import {test, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {fetchPositionPage,addPosition,updatePosition} from '../src/lib/triggerPositionApi.ts';

const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
beforeEach(()=>storage.clear());

test('filter by name, exact Key and status with pagination',async()=>{
  assert.equal((await fetchPositionPage({current:1,size:2})).records.length,2);
  assert.equal((await fetchPositionPage({current:1,size:20,positionName:'推荐'})).total,1);
  assert.equal((await fetchPositionPage({current:1,size:20,positionValue:'home'})).total,0);
  assert.equal((await fetchPositionPage({current:1,size:20,status:0})).total,1);
});
test('add persists and rejects duplicates and invalid Key',async()=>{
  const row={positionName:'测试场景',positionValue:'test_scene'};
  await addPosition(row);
  assert.equal((await fetchPositionPage({current:1,size:20})).total,4);
  await assert.rejects(addPosition(row),/已存在/);
  await assert.rejects(addPosition({positionName:'其他',positionValue:'invalid-key'}),/Key/);
});
test('edit changes fields but preserves Key and supports status toggling',async()=>{
  await updatePosition({id:2,positionName:'改名',sceneDesc:'新描述',status:0,positionValue:'forbidden'});
  const {records}=await fetchPositionPage({current:1,size:20,positionValue:'cart_banner'});
  assert.equal(records[0].positionName,'改名');
  assert.equal(records[0].positionValue,'cart_banner');
  assert.equal(records[0].status,0);
  await updatePosition({id:2,status:1});
  assert.equal((await fetchPositionPage({current:1,size:20,positionValue:'cart_banner'})).records[0].status,1);
});
test('simulated reference blocks disable without persisting mutation',async()=>{
  await assert.rejects(updatePosition({id:1,status:0}),/引用/);
  assert.equal((await fetchPositionPage({current:1,size:20,positionValue:'home_recommendation'})).records[0].status,1);
});
