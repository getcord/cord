import type { Tier } from 'ops/aws/src/common.ts';

export const basicAgentConfig = {
  agent: {
    metrics_collection_interval: 60, // seconds: default is 60. You can specify per-metric overrides, too.
    omit_hostname: true,
  },
  metrics: {
    append_dimensions: { InstanceId: '${aws:InstanceId}' },
    aggregation_dimensions: [['InstanceId']],
    metrics_collected: {
      cpu: {
        measurement: [
          'cpu_usage_idle',
          'cpu_usage_iowait',
          'cpu_usage_user',
          'cpu_usage_system',
          'cpu_usage_guest',
        ],
      },
      disk: {
        measurement: ['disk_used_percent', 'disk_inodes_free'],
        ignore_file_system_types: ['overlay'],
        drop_device: true,
      },
      diskio: {
        measurement: [
          'diskio_io_time',
          'diskio_write_bytes',
          'diskio_read_bytes',
          'diskio_writes',
          'diskio_reads',
        ],
      },
      mem: {
        measurement: [
          'mem_used_percent',
          'mem_used',
          'mem_buffered',
          'mem_cached',
        ],
      },
      swap: {
        measurement: ['swap_used_percent'],
      },
      netstat: {
        measurement: ['netstat_tcp_established', 'netstat_tcp_time_wait'],
      },
    },
  },
};

export const makeAgentConfig = (tier: Tier) => ({
  ...basicAgentConfig,
  metrics: {
    ...basicAgentConfig.metrics,
    append_dimensions: {
      InstanceId: '${aws:InstanceId}',
      AutoScalingGroupName: '${aws:AutoScalingGroupName}',
    },
    aggregation_dimensions: [
      ['AutoScalingGroupName'],
      ['AutoScalingGroupName', 'InstanceId'],
    ],
  },
  logs: {
    logs_collected: {
      files: {
        collect_list: [
          {
            file_path:
              '/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log',
            log_group_name: `${tier}_/CloudWatchAgent/CloudWatchAgentLog/`, // AWS allows {instance_id}, {hostname}, {local_hostname},
            log_stream_name: '{instance_id}_{hostname}', // and {ip_address} in log group/stream names
            timezone: 'Local',
          },
          {
            file_path: '/var/log/messages',
            log_group_name: `${tier}_/CloudWatchAgent/var/log/messages`,
            log_stream_name: '{instance_id}_{hostname}',
            timezone: 'Local',
          },
          {
            file_path: '/var/log/secure',
            log_group_name: `${tier}_/CloudWatchAgent/var/log/secure`,
            log_stream_name: '{instance_id}_{hostname}',
            timezone: 'Local',
          },
          {
            file_path: '/var/log/yum.log',
            log_group_name: `${tier}_/CloudWatchAgent/var/log/yum`,
            log_stream_name: '{instance_id}_{hostname}',
            timezone: 'Local',
          },
        ],
      },
    },
    log_stream_name: '/CloudWatchAgent/catchall', // required but I think unused if log_stream_name is specified for entries in collect_list
  },
});
