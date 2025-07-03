//Javascript

const sumupto = num => {
	let s = 0
	let i = 0
	while (i<num){
		i += 1
		s += i
	}
	return s
}

const timeit = (func, val) => {
	t = performance.now()
	const r = func(val)
	return [performance.now()-t, r]
}
console.log(timeit(sumupto,10**6)) //2.20 ms
console.log(timeit(sumupto,10**7)) //10.20 ms
console.log(timeit(sumupto,10**8)) //100.70 ms
console.log(timeit(sumupto,10**9)) //1003.60 ms