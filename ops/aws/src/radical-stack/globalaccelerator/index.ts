import { aws_globalaccelerator as GA, NestedStack } from 'aws-cdk-lib';
import { ApplicationLoadBalancerEndpoint } from 'aws-cdk-lib/aws-globalaccelerator-endpoints';
import { define } from 'ops/aws/src/common.ts';
import { loadBalancer } from 'ops/aws/src/radical-stack/ec2/loadBalancers.ts';
import { radicalStack } from 'ops/aws/src/radical-stack/stack.ts';

const stack = define(
  () => new NestedStack(radicalStack(), 'stack-accelerator'),
);

export const accelerator = define(() => {
  return new GA.Accelerator(stack(), 'accelerator');
});

define(() => {
  const listener = new GA.Listener(stack(), 'accelerator-listener', {
    accelerator: accelerator(),
    portRanges: [
      { fromPort: 80, toPort: 80 },
      { fromPort: 443, toPort: 443 },
    ],
    protocol: GA.ConnectionProtocol.TCP,
  });
  return new GA.EndpointGroup(stack(), 'accelerator-endpointgroup', {
    listener,
    endpoints: [new ApplicationLoadBalancerEndpoint(loadBalancer())],
  });
});
