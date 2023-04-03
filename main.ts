import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";

const WEB_SOCKET = "ws://127.0.0.1:9944";
const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const connectSubstrate = async () => {
  const wsProvider = new WsProvider(WEB_SOCKET);
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;
  console.log("connection to substrate is OK.");
  return api;
};

const getConst = async (api: ApiPromise) => {
  const existentialDeposit =
    await api.consts.balances.existentialDeposit.toHuman();
  return existentialDeposit;
};

const getFreeBalance = async (api: ApiPromise, address: string) => {
  const { data: balance } = await api.query.system.account(address);
  return balance?.free.toHuman();
};

const printAliceBobBalance = async (api: ApiPromise) => {
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const bob = keyring.addFromUri("//Bob");
  console.log("alice balance is:", await getFreeBalance(api, alice.address));
  console.log("bob balance is:", await getFreeBalance(api, bob.address));
};

const transferFromAliceToBob = async (api: ApiPromise, amount: number) => {
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const bob = keyring.addFromUri("//Bob");
  await api.tx.balances
    .transfer(bob.address, amount)
    .signAndSend(alice, (res) => console.log(`Tx status: ${res.status}`));
};

// subscribe balance change
const subscribeAliceBalance = async (api:ApiPromise) => {
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');
  await api.query.system.account(alice.address, aliceAcct => {
    console.log("Subscribed to Alice account.");
    const aliceFreeSub = aliceAcct.data.free;
    console.log(`Alice Account (sub): ${aliceFreeSub}`)
  });
}

// get metadata
const getMetadata = async (api: ApiPromise) => {
  const metadata = await api.rpc.state.getMetadata();
  console.log("print metadata:");
  console.log(metadata);
  return metadata;
}

// subscribe event
const subscribeEvent = async (api: ApiPromise) => {
  api.query.system.events((events) => {
    console.log(`\nReceived ${events.length} events:`);

    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;
      // Show what we are busy with
      console.log(`${event.section}:${event.method}:: ( phase= ${phase.toString()} )`);

      // Loop through each of the parameters, displaying the type and data
      event.data.forEach((data, index) => {
        console.log(`\t\t${types[index].type}: ${data.toString()}\n`);
      });
    });
  })
}

const main = async () => {
  const api = await connectSubstrate();
  /* console.log("const value existentialDeposit is:", await getConst(api));
  await printAliceBobBalance(api);
  await transferFromAliceToBob(api, 10 ** 12);
  await sleep(6000); */
  /* await subscribeAliceBalance(api);
  await sleep(60000); */
  // await getMetadata(api);
  await subscribeEvent(api);
  await sleep(600000);
  console.log("game over");
};

main()
  .then(() => {
    console.log("successfully exited");
    process.exit(0);
  })
  .catch((err) => {
    console.log("error occur:", err);
    process.exit(1);
  });
