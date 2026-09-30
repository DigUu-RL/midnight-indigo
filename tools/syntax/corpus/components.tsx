import React, { Component, memo } from 'react';

export default function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

export const Card: React.FC<{ title: string }> = ({ title }) => <h2>{title}</h2>;

export const Row = memo((props: { id: number }) => <li>{props.id}</li>);

export class Legacy extends Component<{ name: string }> {
  render() {
    return <Card title={this.props.name} />;
  }
}
