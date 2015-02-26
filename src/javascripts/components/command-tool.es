import React from "react";
import {post} from "superagent";

function coerceParams(params) {
  return params.map(function(param) {
    if (param.type === "boolean") {
      param.value = !!~["true", "t"].indexOf(param.value.toLowerCase());
    }

    if (param.type === "number") {
      param.value = +param.value;
    }

    return param.value;
  });
}

function generateOptions(arr) {
  return arr.map((val) => <option key={val} value={val}> {val} </option> );
}

export default React.createClass({
  getInitialState: function() {
    return {
      command: this.props.commands[0],
      params: [ { key: "", value: "", type: "string" } ],
      results: []
    };
  },

  chooseCommand: function(event) {
    return this.setState({ command: event.target.value });
  },

  addParam: function() {
    let params = this.state.params;
    params.push({ key: "", value: "", type: "string" });
    this.setState({ params: params });
  },

  updateParam: function(idx, prop) {
    return (e) => {
      let params = this.state.params;
      params[idx][prop] = e.target.value;
      this.setState({ params: params });
    };
  },

  removeParam: function(idx) {
    return () => {
      let params = this.state.params;

      if (params.length > 1) {
        params.splice(idx, 1);
        this.setState({ params: params });
      }
    };
  },

  runCommand: function() {
    let command = this.state.command,
        url = `${this.props.endpoint}/commands/${encodeURIComponent(command)}`,
        params = coerceParams(this.state.params);

    post(url)
      .set("Content-Type", "application/json")
      .send(params)
      .end((res) => {
        let results = this.state.results,
            body = res.body;

        if (body.result != null) {
          results.unshift(body.result);

          if (results.length > 5) {
            results.pop();
          }

          this.setState({ results: results });
        }
      });
  },

  params: function() {
    return this.state.params.map((param, idx) => {
      let length = this.state.params.length;

      let remove = this.removeParam(idx);

      let update = {
        key:   this.updateParam(idx, "key"),
        value: this.updateParam(idx, "value"),
        type:  this.updateParam(idx, "type")
      };

      return (
        <div key={idx} className="input">
          <input placeholder="key"
                 onChange={update.key}
                 value={param.key} />

          <input placeholder="value"
                 onChange={update.value}
                 value={param.value} />

          <select onChange={update.type} value={param.type}>
            {generateOptions(["string", "boolean", "number"])}
          </select>

          <button disabled={length === 1} onClick={remove}>&#x2716;</button>
        </div>
      );
    });
  },

  results: function() {
    return this.state.results.map((res, idx) => {
      return (
        <div key={idx}>
          <code>{res}</code>
        </div>
      );
    });
  },

  render: function() {
    let params = this.params(),
        results = this.results();

    return (
      <div className="command-tool">
        <h1>Commands</h1>

        <div className="form">
          <select value={this.state.command} onChange={this.selectCommand}>
            {generateOptions(this.props.commands)}
          </select>

          <div className="params">
            {params}
            <button onClick={this.addParam}>Add</button>
          </div>

          <button onClick={this.runCommand}> Run </button>
        </div>

        <div className="results">
          {results}
        </div>
      </div>
    );
  }
});