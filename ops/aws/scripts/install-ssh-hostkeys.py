#!/usr/bin/env python3

import argparse
import json
import os
import subprocess

key_directory = "/etc/ssh"


def main():
    parser = argparse.ArgumentParser(
        description="Install SSH host keys from AWS Secretsmanager secret"
    )
    parser.add_argument(
        "--secret-id", help="ID of secret containing host keys", required=True
    )
    args = parser.parse_args()

    with subprocess.Popen(
        [
            "aws",'--region','eu-west-2',
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            args.secret_id,
        ],
        stdout=subprocess.PIPE,
    ) as proc:
        data = json.load(proc.stdout)

    secret = json.loads(data["SecretString"])

    for key, value in secret.items():
        keyfile = os.path.join(key_directory, f"ssh_host_{key}_key")
        pubkeyfile = f"{keyfile}.pub"

        with open(
            keyfile,
            "w",
            opener=lambda path, flags: os.open(path, flags, 0o600),
        ) as f:
            f.write(value)

        with open(pubkeyfile, "w") as f:
            subprocess.check_call(
                ["ssh-keygen", "-y", "-f", keyfile], stdout=f
            )

    subprocess.check_call(["systemctl", "reload", "ssh"])


if __name__ == "__main__":
    main()
