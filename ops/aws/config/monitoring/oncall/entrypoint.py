# Copyright (c) LinkedIn Corporation. All rights reserved. Licensed under the BSD-2 Clause license.

import os
import socket
import time
import sys
from oncall.utils import read_config

def wait_for_mysql(config):
    print('Checking MySQL liveness on %s...' % config['host'])
    db_address = (config['host'], config['port'])
    tries = 0
    while True:
        try:
            sock = socket.socket()
            sock.connect(db_address)
            sock.close()
            break
        except socket.error:
            if tries > 20:
                print('Waited too long for DB to come up. Bailing.')
                sys.exit(1)

            print('DB not up yet. Waiting a few seconds..')
            time.sleep(2)
            tries += 1
            continue


def main():
    oncall_config = read_config('/home/oncall/config/config.yaml')
    mysql_config = oncall_config['db']['conn']['kwargs']

    # It often takes several seconds for MySQL to start up. oncall dies upon start
    # if it can't immediately connect to MySQL, so we have to wait for it.
    wait_for_mysql(mysql_config)

    os.execv('/usr/bin/uwsgi',
             ['/usr/bin/uwsgi', '--yaml', '/home/oncall/daemons/uwsgi.yaml:prod'])


if __name__ == '__main__':
    main()