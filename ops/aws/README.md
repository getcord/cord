## AWS CloudFormation

This directory contains the complete configuration of our AWS deployment. That
is at least the aspiration. For the time being, some service may have been
configured on Amazon's web UIs. Hopefully, they all get migrated into this
configuration system.

### How this works

We are using Amazon's 'aws-cdk' TypeScript library, which makes it easy to
create resources and reference them in the definition of further resources.

In order to see the difference between the current live configuration and the
definitions in here, call `npm run diff`. If you are happy to roll out those
changes into the live deployment, run `npm run deploy`. Another useful command
may be `npm run synth`, which synthesizes a JSON file representing all the
resources defined here in code. It gets placed in the `cdk.out` directory.

More conveniently, you can call `scripts/sync-cloudformation.sh` from
monorepo's main directory. That script will show you the output of `npm run diff` and then offer you (interactively) to go ahead and deploy any changes.

### How to change or add to the AWS deployment

The Amazon AWS-CDK toolchain builds the configuration from all resources that
were instantiated. E.g. calling `new EC2.Instance(...)` will create an object
representing a EC2 instance, and it will automatically add it to the
configuration. We don't have to collect all those objects and pass them on to
some CDK function or class. No, CDK does that for us automatically.

So, we have a bunch of TypeScript files in `src`, and any AWS resources created
anywhere in them will become part of the config.

To make it super convenient, the setup here will automatically import all
TypeScript files in the `src` directory and its sub-directories. So if you want
to add new resources, you can just create a new file and make some new
resources in there. No need to import your new file manually from anywhere.

To complicate things slightly again, resources can depend on each other. For
instance the load balancer needs the SSL certificate. The SSL certificate
definition needs the DNS zones in order to put those authentication records
into the DNS zone, so that we can obtain an SSL certificate. But then other
DNS records for our domains need the IP address of the load balancer. So,
dependencies are generally going forth and back all over the place. That's just
what it is.

It would be frustrating if we had to work out the order in which things can
instantiated to satisfy all those cross-dependencies ourselves. That's why
there is a nifty little tool defined in `src/common.ts`. It's just a single
function, called `define`.

Instead of creating resources in top level code, we wrap everything into
functions that we pass to define. So, instead of

```
export const someVm = new EC2.Instance(...);  // NOT COOL. DON'T DO THIS
```

we do

```
export const someVm = define(() = > new EC2.Instance(...)); // THUMBS UP
```

So at the time the code is imported, the EC2 instance is not created, but a
function object that will do that is passed to `define`.

Any function passed to `define` is guaranteed to be called exactly once. So you
know that all those resources you create in those functions you pass to
`define`, they all will eventually be created.

If you need to reference `someVm` somewhere, i.e. if you want to pass the
`EC2.Instance` object to e.g. some other resource's constructor, you have to
suffix it with empty parentheses. I.e. `someVm()` will give you the
`EC2.Instance` object.

The order in which those `define` functions will eventually be called is
somewhat random, but will respect the dependencies between them.

If you managed to create cyclic dependencies, the scripts will fail with an
exception with a 'Cyclic dependency' message. If that happens, you usually have
to break up one `define` call (in which you maybe created multiple resources)
into several. The fainer grained units should resovle cyclic dependencies.
