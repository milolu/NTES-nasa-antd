import Mock, { Random } from 'mockjs';
import qs from 'qs';

Mock.mock(/\/mock\/tableex/, function(options) {
  let str = options.url.split('?')[1];
  let params = qs.parse(str);
  let pageSize = params.page_rows || 10;
  let current = params.page || 1;
  console.log('mock options', { ...options, params });

  return Mock.mock({
    [`data|${pageSize}`]: [{
      'id|+1': 100,
      'name': '@cname',
      'project': '@first',
      'content': '@string',
    }],
    "page_rows": parseInt(pageSize, 10),
    "page_now": parseInt(current, 10),
    'page_total': Random.natural(pageSize * current, pageSize * current + 100),
  });
});