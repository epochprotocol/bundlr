// runner script, to create

/**
 * a simple script runner, to test the bundler and API.
 * for a simple target method, we just call the "nonce" method of the account itself.
 */

import { BigNumber, Signer, Wallet } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SimpleAccountFactory__factory } from 'epoch-accountabstraction/contracts'
import { SimpleAccountFactory2__factory } from 'epoch-accountabstraction/contracts'

import { formatEther, keccak256, parseEther } from 'ethers/lib/utils'
import { Command } from 'commander'
import { erc4337RuntimeVersion } from '@account-abstraction/utils'
import fs from 'fs'
import { DeterministicDeployer, HttpRpcClient, SimpleAccountAPI } from '@account-abstraction/sdk'
import { runBundler } from '../runBundler'
import { BundlerServer } from '../BundlerServer'
import { getNetworkProvider } from '../Config'

const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

class Runner {
  bundlerProvider!: HttpRpcClient
  accountApi!: SimpleAccountAPI
  accountApi2!: SimpleAccountAPI


  /**
   *
   * @param provider - a provider for initialization. This account is used to fund the created account contract, but it is not the account or its owner.
   * @param bundlerUrl - a URL to a running bundler. must point to the same network the provider is.
   * @param accountOwner - the wallet signer account. used only as signer (not as transaction sender)
   * @param entryPointAddress - the entrypoint address to use.
   * @param index - unique salt, to allow multiple accounts with the same owner
   */
  constructor(
    readonly provider: JsonRpcProvider,
    readonly bundlerUrl: string,
    readonly accountOwner: Signer,
    readonly entryPointAddress = ENTRY_POINT,
    readonly index = 0
  ) {
  }

  async getAddress(): Promise<string> {
    return await this.accountApi.getCounterFactualAddress()
  }
  async getAddress2(): Promise<string> {
    return await this.accountApi2.getCounterFactualAddress()
  }

  async init(deploymentSigner?: Signer): Promise<this> {
    const net = await this.provider.getNetwork()
    const chainId = net.chainId
    const dep = new DeterministicDeployer(this.provider)
    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [this.entryPointAddress])
    const accountDeployer2 = DeterministicDeployer.getAddress(new SimpleAccountFactory2__factory(), 0, [this.entryPointAddress])

    // const accountDeployer = await new SimpleAccountFactory__factory(this.provider.getSigner()).deploy().then(d=>d.address)
    if (!await dep.isContractDeployed(accountDeployer)) {
      if (deploymentSigner == null) {
        console.log(`AccountDeployer not deployed at ${accountDeployer}. run with --deployFactory`)
        process.exit(1)
      }
      const dep1 = new DeterministicDeployer(deploymentSigner.provider as any, deploymentSigner)
      const dep2 = new DeterministicDeployer(deploymentSigner.provider as any, deploymentSigner)

      await dep2.deterministicDeploy(new SimpleAccountFactory2__factory(), 0, [this.entryPointAddress])

      await dep1.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [this.entryPointAddress])
    }
    this.bundlerProvider = new HttpRpcClient(this.bundlerUrl, this.entryPointAddress, chainId)
    this.accountApi = new SimpleAccountAPI({
      provider: this.provider,
      entryPointAddress: this.entryPointAddress,
      factoryAddress: accountDeployer,
      owner: this.accountOwner,
      index: this.index,
      overheads: {
        // perUserOp: 100000
      }
    })
    this.accountApi2 = new SimpleAccountAPI({
      provider: this.provider,
      entryPointAddress: this.entryPointAddress,
      factoryAddress: accountDeployer2,
      owner: this.accountOwner,
      index: this.index,
      overheads: {
        // perUserOp: 100000
      }
    })
    return this
  }

  parseExpectedGas(e: Error): Error {
    // parse a custom error generated by the BundlerHelper, which gives a hint of how much payment is missing
    const match = e.message?.match(/paid (\d+) expected (\d+)/)
    if (match != null) {
      const paid = Math.floor(parseInt(match[1]) / 1e9)
      const expected = Math.floor(parseInt(match[2]) / 1e9)
      return new Error(`Error: Paid ${paid}, expected ${expected} . Paid ${Math.floor(paid / expected * 100)}%, missing ${expected - paid} `)
    }
    return e
  }

  async runUserOp(target: string, data: string): Promise<void> {
    let nonce = (await this.accountApi.getNonce()) as BigNumber
    let nonce2 = (await this.accountApi2.getNonce()) as BigNumber

    console.log("NONCE 1:", nonce)
    console.log("NONCE 2:", nonce2)





    const userOp = await this.accountApi.createSignedUserOp({
      target,
      data
    })
    try {
      const userOpHash = await this.bundlerProvider.sendUserOpToBundler(userOp)
      const txid = await this.accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      throw this.parseExpectedGas(e)
    }




    ////logsss
    let _nonce = (await this.accountApi.getNonce()) as BigNumber

    console.log("_NONCE 1:", _nonce)

    let _nonce2 = (await this.accountApi2.getNonce()) as BigNumber

    console.log("_NONCE 2:", _nonce2)

    console.log("Account API 2", await this.accountApi2?.getAccountAddress())
    console.log("Account API 2 CC", await this.accountApi2?.getCounterFactualAddress())
    // console.log("Account API 2", await this.accountApi2?.g())

    console.log("Account API 1", await this.accountApi?.getAccountAddress())
    console.log("Account API 1 CC", await this.accountApi?.getCounterFactualAddress())
  }
  async runAdvancedUserOp(target: string, data: string): Promise<void> {
    let nonce = (await this.accountApi.getNonce()) as BigNumber
    let nonce2 = (await this.accountApi2.getNonce()) as BigNumber

    console.log("NONCE 1:", nonce)
    console.log("NONCE 2:", nonce2)




    // nonce = nonce.add(1);
    const userOp = await this.accountApi2.createSignedUserOp({
      target,
      data,
      nonce: nonce2,
      advancedUserOperation: {
        executionWindowStart: 0,
        executionWindowEnd: 2684917837,
        readyForExecution: false,
      }
    })
    console.log("userOp: ", userOp);

    try {
      console.log("Before advanced operation")
      const userOpHash = await this.bundlerProvider.sendUserOpToBundler(userOp)
      console.log("Right after advanced operation")

      console.log(userOpHash);
    } catch (e: any) {
      console.log("Error:", e.toString());
      throw this.parseExpectedGas(e)
    }




    ///logssssss
    let _nonce = (await this.accountApi.getNonce()) as BigNumber

    console.log("_NONCE 1:", _nonce)

    let _nonce2 = (await this.accountApi2.getNonce()) as BigNumber

    console.log("_NONCE 2:", _nonce2)

    console.log("NONCE 1:", _nonce)
    console.log("Account API 2", await this.accountApi2?.getAccountAddress())
    console.log("Account API 2 CC", await this.accountApi2?.getCounterFactualAddress())

    console.log("Account API 1", await this.accountApi?.getAccountAddress())
    console.log("Account API 1 CC", await this.accountApi?.getCounterFactualAddress())

  }
}

async function main(): Promise<void> {
  const program = new Command()
    .version(erc4337RuntimeVersion)
    .option('--network <string>', 'network name or url', 'http://localhost:8545')
    .option('--mnemonic <file>', 'mnemonic/private-key file of signer account (to fund account)')
    .option('--bundlerUrl <url>', 'bundler URL', 'http://localhost:3000/rpc')
    .option('--entryPoint <string>', 'address of the supported EntryPoint contract', ENTRY_POINT)
    .option('--nonce <number>', 'account creation nonce. default to random (deploy new account)')
    .option('--deployFactory', 'Deploy the "account deployer" on this network (default for testnet)')
    .option('--show-stack-traces', 'Show stack traces.')
    .option('--selfBundler', 'run bundler in-process (for debugging the bundler)')

  const opts = program.parse().opts()
  const provider = getNetworkProvider(opts.network)
  let signer: Signer
  const deployFactory: boolean = opts.deployFactory
  let bundler: BundlerServer | undefined
  if (opts.selfBundler != null) {
    // todo: if node is geth, we need to fund our bundler's account:
    const signer = provider.getSigner()

    const signerBalance = await provider.getBalance(signer.getAddress())

    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    const bal = await provider.getBalance(account)
    if (bal.lt(parseEther('1')) && signerBalance.gte(parseEther('10000'))) {
      console.log('funding hardhat account', account)
      await signer.sendTransaction({
        to: account,
        value: parseEther('1').sub(bal)
      })
    }

    const argv = ['node', 'exec', '--config', './localconfig/bundler.config.json', '--unsafe', '--auto']
    if (opts.entryPoint != null) {
      argv.push('--entryPoint', opts.entryPoint)
    }
    bundler = await runBundler(argv)
    await bundler.asyncStart()
  }
  if (opts.mnemonic != null) {
    signer = Wallet.fromMnemonic(fs.readFileSync(opts.mnemonic, 'ascii').trim()).connect(provider)
  } else {
    try {
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
        console.log('fatal: no account. use --mnemonic (needed to fund account)')
        process.exit(1)
      }
      // for hardhat/node, use account[0]
      signer = provider.getSigner()
      // deployFactory = true
    } catch (e) {
      throw new Error('must specify --mnemonic')
    }
  }
  const accountOwner = new Wallet('0x'.padEnd(66, '7'))

  const index = opts.nonce ?? Date.now()
  console.log('using account index=', index)
  const client = await new Runner(provider, opts.bundlerUrl, accountOwner, opts.entryPoint, index).init(deployFactory ? signer : undefined)

  const addr = await client.getAddress()
  const addr2 = await client.getAddress2()

  async function isDeployed(addr: string): Promise<boolean> {
    return await provider.getCode(addr).then(code => code !== '0x')
  }

  async function getBalance(addr: string): Promise<BigNumber> {
    return await provider.getBalance(addr)
  }

  const bal = await getBalance(addr)
  const bal2 = await getBalance(addr2)

  console.log('account address', addr, 'account address2', addr2, 'deployed=', await isDeployed(addr), 'deployed=', await isDeployed(addr2), 'bal=', formatEther(bal), 'ba2=', formatEther(bal2))
  const gasPrice = await provider.getGasPrice()
  // TODO: actual required val
  const requiredBalance = gasPrice.mul(2e6)
  if (bal.lt(requiredBalance.div(2))) {
    console.log('funding account to', requiredBalance.toString())
    await signer.sendTransaction({
      to: addr,
      value: requiredBalance.sub(bal)
    }).then(async tx => await tx.wait())
  } else {
    console.log('not funding account. balance is enough')
  }
  if (bal2.lt(requiredBalance.div(2))) {
    console.log('funding account to', requiredBalance.toString())
    await signer.sendTransaction({
      to: addr2,
      value: requiredBalance.sub(bal2)
    }).then(async tx => await tx.wait())
  } else {
    console.log('not funding account. balance is enough')
  }

  const dest = addr
  const dest2 = addr2

  const data = keccak256(Buffer.from('entryPoint()')).slice(0, 10)
  console.log('data=', data)
  await client.runUserOp(dest, data)
  console.log('after run1')
  // // client.accountApi.overheads!.perUserOp = 30000
  // await client.runUserOp(dest2, data)
  // console.log('after run2')

  // await client.runAdvancedUserOp(dest2, data)
  // console.log('after run advanced')
  await bundler?.stop()
}

void main()
  .catch(e => { console.log(e); process.exit(1) })
  .then(() => process.exit(0))