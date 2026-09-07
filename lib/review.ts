// A zero rating and empty verdict mean the viewer left those fields unset.
export function reviewInput(input: {body?:unknown;rating?:unknown;verdict?:unknown;liked?:unknown}) {
  const body=input.body??'', rating=input.rating??0, verdict=input.verdict??'', liked=input.liked??false;
  if(typeof body!=='string'||body.length>3000||typeof rating!=='number'||![0,1,2,3,4,5].includes(rating)||typeof verdict!=='string'||!['','theatre','home','either'].includes(verdict)||typeof liked!=='boolean') throw new Error('Please check your rating or review.');
  return {body:body.trim(),rating,verdict,liked:liked?1:0};
}
