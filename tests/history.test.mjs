import test from 'node:test';import assert from 'node:assert/strict';
import {LocalGameRepository,GameHistory,browserUuid} from '../.test/src/game-history.js';
import {createState,serve} from '../.test/src/simulation.js';
class Storage{data=new Map();get length(){return this.data.size;}key(i){return [...this.data.keys()][i]??null;}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}}
function setup(storage=new Storage()){
 let id=0,time=0;const uuid=()=>`00000000-0000-4000-8000-${String(++id).padStart(12,'0')}`;
 const repo=new LocalGameRepository(storage,uuid),history=new GameHistory(repo,uuid,()=>new Date(1700000000000+(time+=15000)).toISOString());
 const s=createState('novice');return {storage,repo,history,s};
}
test('browser UUID persists across page loads and game IDs stay distinct',()=>{
 const a=setup();const b=new LocalGameRepository(a.storage,()=>{throw Error('should reuse identity');});assert.equal(a.repo.browserId,b.browserId);
 serve(a.s);a.history.begin(a.s,true);a.history.checkpoint(a.s,false,true,'abandoned');a.history.begin(a.s,true);
 const games=a.repo.list();assert.equal(games.length,2);assert.notEqual(games[0].gameId,games[1].gameId);assert.ok(games.every(g=>g.browserId===a.repo.browserId));
 assert.match(browserUuid(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
test('checkpoints upsert one game with score, time and settings; no welcome-screen game',()=>{
 const {repo,history,s}=setup();history.observe(s,false,true);history.begin(s,true);assert.equal(repo.list().length,0);
 serve(s);history.begin(s,true);const id=repo.list()[0].gameId;
 s.remaining=165;s.score=[2,1];history.checkpoint(s,false,true);
 let g=repo.list()[0];assert.equal(repo.list().length,1);assert.equal(g.gameId,id);assert.deepEqual(g.score,{home:2,away:1});assert.equal(g.playedSeconds,15);assert.equal(g.status,'in_progress');assert.equal(g.result,null);
 s.difficulty='hard';history.observe(s,true,false);g=repo.list()[0];assert.equal(g.status,'paused');assert.equal(g.difficulty,'hard');assert.equal(g.initialDifficulty,'novice');assert.equal(g.autoGoalie,false);assert.equal(g.initialAutoGoalie,true);

});
test('completion stores win/loss/draw and cannot be overwritten by exit or restart',()=>{
 for(const [score,result] of [[[3,1],'win'],[[0,2],'loss'],[[2,2],'draw']]){
  const {repo,history,s}=setup();serve(s);history.begin(s,true);s.score=score;s.remaining=0;s.phase='finished';history.observe(s,false,true);
  const g=repo.list()[0];assert.equal(g.status,'completed');assert.equal(g.result,result);assert.ok(g.endedAt);
  history.checkpoint(s,false,true,'abandoned');history.checkpoint(s,false,true,'interrupted');assert.deepEqual(repo.list()[0],g);
 }
});
test('restart keeps abandoned game and page exit keeps interrupted score; back-forward resume upserts',()=>{
 const {repo,history,s,storage}=setup();serve(s);history.begin(s,true);s.score=[1,2];history.checkpoint(s,false,true,'interrupted');
 assert.equal(repo.list()[0].status,'interrupted');assert.equal(repo.list()[0].result,null);
 const reloaded=new LocalGameRepository(storage,browserUuid);assert.deepEqual(reloaded.list()[0].score,{home:1,away:2});
 history.checkpoint(s,true,true);assert.equal(repo.list()[0].status,'paused');assert.equal(repo.list()[0].endedAt,null);
 history.checkpoint(s,true,true,'abandoned');history.begin(s,true);assert.equal(repo.list().length,2);assert.ok(repo.list().some(g=>g.status==='abandoned'));
});
test('separate tabs retain each others records without a shared index overwrite',()=>{
 const storage=new Storage(),a=setup(storage),b=setup(storage);serve(a.s);serve(b.s);a.history.begin(a.s,true);
 // Give second instance its own UUID factory, as independent browsers do with crypto.
 const h=new GameHistory(b.repo,browserUuid,()=>new Date().toISOString());h.begin(b.s,true);
 assert.equal(a.repo.list().length,2);assert.equal(b.repo.list().length,2);
});
test('corrupt records are preserved, storage errors retain in-memory results without throwing',()=>{
 const storage=new Storage();storage.setItem('nwbhf:v1:game:broken','{');const {repo,history,s}=setup(storage);serve(s);history.begin(s,true);assert.equal(repo.list().length,1);assert.equal(storage.getItem('nwbhf:v1:game:broken'),'{');
 let errors=0;const bad={getItem(){throw Error();},setItem(){throw Error();},get length(){throw Error();},key(){return null;}};
 const fallback=new LocalGameRepository(bad,browserUuid,()=>errors++),h=new GameHistory(fallback,browserUuid,()=>new Date().toISOString());
 h.begin(s,true);h.checkpoint(s,false,true);assert.equal(fallback.list().length,1);assert.ok(errors>0);
});
