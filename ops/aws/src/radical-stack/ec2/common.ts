import type {
  aws_autoscaling as autoScaling,
  aws_ec2 as EC2,
} from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';

/**
 * Enables EC2 Instance Connect on the given object.  The object can be an EC2
 * instance, in which case it applies to that instance, or it can be something
 * like an auto-scaling group, in which case it applies to every instance
 * in that group.
 *
 * See
 * https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-connect-set-up.html
 */
export function enableEc2InstanceConnect(
  obj: EC2.Instance | autoScaling.AutoScalingGroup,
) {
  Tags.of(obj).add('enable-ec2-connect', 'true');
}

/**
 * Don't treat this instance as successfully created until cfn-init has
 * completed.  This means that if there's a problem with the package installs or
 * other commands in user data, CF will treat the instance as failed creation
 * and roll it back rather than leaving it in a broken state.
 */
export function waitForInstanceInit(instance: EC2.Instance) {
  // The default UserData for EC2 instances includes a call to cfn-signal after
  // all the initialization is done. This says that the instance is successfully
  // created if it receives that signal before the timeout.
  instance.instance.cfnOptions.creationPolicy = {
    resourceSignal: {
      count: 1,
      timeout: 'PT5M', // 5 minutes
    },
  };
}
