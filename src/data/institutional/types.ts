export type EditorialLink = {label:string;href:string};
export type EditorialItem = {_id:string;visible:number;[field:string]:string|number};
export type Article = EditorialItem & {slug:string;title:string;publishedAt:string;cover:string;alt:string;body:string;status:'draft'|'published'};
export type EditorialSection = {title?:string;subtitle?:string;eyebrow?:string;highlight?:string;image?:string;alt?:string;cta?:EditorialLink;items?:EditorialItem[];[field:string]:string|number|EditorialLink|EditorialItem[]|undefined};
