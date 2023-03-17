const { ApiPromise, WsProvider } = require("@polkadot/api");

const websocketUrls = {
  Amplitude: "wss://pencol-kus-01.pendulumchain.tech",
  Pendulum: "wss://rpc-pendulum.prd.pendulumchain.tech",
};

async function main() {
  const network = process.argv[2] == "amplitude" ? "Amplitude" : "Pendulum";
  const websocketUrl = websocketUrls[network] ?? websocketUrls.pendulum;

  console.log(`Determine issuance on ${network} ...`);

  const wsProvider = new WsProvider(websocketUrl);
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  const accounts = await api.query.system.account.entries();

  let totalIssuance = 0n;
  let totalTransferable = 0n;
  let totalLocked = 0n;
  let totalReserved = 0n;

  accounts.forEach((entry) => {
    const balances = entry[1].toHuman().data;
    const miscFrozen = BigInt(balances.miscFrozen.replace(/,/g, ""));
    const feeFrozen = BigInt(balances.feeFrozen.replace(/,/g, ""));
    const frozen = miscFrozen > feeFrozen ? miscFrozen : feeFrozen;
    const free = BigInt(balances.free.replace(/,/g, ""));
    const reserved = BigInt(balances.reserved.replace(/,/g, ""));

    totalIssuance += free + reserved;
    totalTransferable += free - frozen;
    totalLocked += frozen;
    totalReserved += reserved;
  });

  const format = (n) => {
    let letters = n.toString(10).padStart(13, "0").slice(0, -9);
    let str = `${letters.slice(-6, -3)}.${letters.slice(-3)}`;
    letters = letters.slice(0, -6);
    while (letters.length) {
      str = `${letters.slice(-3)},${str}`;
      letters = letters.slice(0, -3);
    }
    return str;
  };

  console.log("\nTotal issuance:", format(totalIssuance));
  console.log("Total transferable (in circulation):", format(totalTransferable));
  console.log("Total locked:", format(totalLocked));
  console.log("Total reserved:", format(totalReserved));

  process.exit();
}

main();
