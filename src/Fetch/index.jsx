/**
 * 数据获取组件
 */
import React, { Component } from 'react';
import _ from 'lodash';

let requesting = {};

export default class Fetch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      response: {}
    };
  }

  static defaultProps = {
    api: null,
    history: [],
    params: null,
    cacheKey: null, // 定义该字段时，将在本地进行缓存，当history中最后一个对象+params+cacheKey这几个都未变更时，接口不发起
    onRequest: params => params,
    onResponse: res => ({ data: res }),
    component: null, // 子元素组件
    onLoadingChange: null, // 状态变更事件
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.history, nextProps.history)) {
      console.log(nextProps.history);
      setTimeout(this.getData);
    }
  }

  componentDidMount() {
    this.getData();
    this.props.onLoadingChange && this.props.onLoadingChange(false);
  }

  componentWillUnmount() {}

  getCache = () => {
    let key = this.getActuallyCacheKey();
    let value = window.sessionStorage.getItem(key);
    if (!value) {
      return null;
    }
    return JSON.parse(window.sessionStorage.getItem(key) || '{}');
  }

  setCache = (value) => {
    let key = this.getActuallyCacheKey();
    window.sessionStorage.setItem(this.getActuallyCacheKey(key), JSON.stringify(value));
  }

  /**
   * 生成key
   * @return {[type]} [description]
   */
  getActuallyCacheKey = () => {
    return `${JSON.stringify(this.props.cacheKey)}-${JSON.stringify(_.last(this.props.history))}-${JSON.stringify(this.props.params)}`;
  }

  requestSuccCallback = (res, requestParams) => {
    let response = this.props.onResponse(res, requestParams);
    if (this.props.cacheKey) {
      this.setCache(response);
    }
    this.setState({
      loading: false,
      response: response
    });
    this.props.onLoadingChange && this.props.onLoadingChange(false);
  }

  requestErrCallback = (res, requestParams) => {
    this.setState({ loading: false });
    this.props.onLoadingChange && this.props.onLoadingChange(false);
  }

  request = () => {
    this.setState({ loading: true });
    this.props.onLoadingChange && this.props.onLoadingChange(true);

    // 判定队列中是否有相同请求，如果开启缓存且队列中已存在，则不在请求
    let key = new Date().getTime();
    if (this.props.cacheKey) {
      key = this.getActuallyCacheKey();
    }
    if (!requesting[key]) {
      requesting[key] = [];
      let params = Object.assign({}, _.last(this.props.history), this.props.params);
      params = this.props.onRequest(params) || params;
      this.props.api(params)
        .then(res => {
          requesting[key].forEach(item => item.success(res, params));
          delete requesting[key];
        }).catch(res => {
          requesting[key].forEach(item => item.error(res, params));
          delete requesting[key];
        });
    }
    requesting[key].push({ success: this.requestSuccCallback, error: this.requestErrCallback });
  }

  getData = () => {
    if (!this.props.api || !_.isArray(this.props.history) || this.props.history.length === 0) {
      return;
    }
    if (this.props.cacheKey) {
      let response = this.getCache();
      if (response) {
        this.setState({ response });
        return;
      }
    }
    this.request();
  }

  render() {
    if (!this.props.component) {
      return null;
    }
    let props = { loading: this.state.loading, ...this.state.response };
    return React.cloneElement(this.props.component, props);
  }
}